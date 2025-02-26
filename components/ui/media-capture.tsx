'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Camera, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MediaCaptureState, MediaMode, MediaFile } from '@/types/media-capture'
import { useTimer } from '@/hooks/use-timer'

/**
 * Props for the MediaModeTab subcomponent
 * @internal
 */
type MediaModeTabProps = {
  mode: MediaMode
  isSelected: boolean
  onClick: () => void
  disabled: boolean
}

/**
 * Props for the MediaCapture component
 */
type MediaCaptureProps = {
  /** Callback fired when media is captured. Receives the captured file with metadata */
  onCapture: (file: MediaFile) => void
  /** Callback fired when the capture interface should be closed */
  onClose: () => void
}

/**
 * A full-screen media capture interface for photos and videos
 * 
 * @component
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false)
 *   const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
 * 
 *   const handleCapture = (file: MediaFile) => {
 *     setMediaFiles(prev => [...prev, file])
 *   }
 * 
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Open Camera</Button>
 *       
 *       {isOpen && (
 *         <MediaCapture
 *           onCapture={handleCapture}
 *           onClose={() => setIsOpen(false)}
 *         />
 *       )}
 *     </>
 *   )
 * }
 * ```
 * 
 * @features
 * - Supports both photo and video capture
 * - Automatically uses back camera with fallback to front camera
 * - Shows recording duration for videos
 * - Auto-closes after successful capture
 * - Full-screen mobile-first interface
 * - Proper stream cleanup on unmount
 * 
 * @bestPractices
 * - Mount/unmount the component rather than hiding it
 * - Handle the returned File objects promptly as they consume memory
 * - Consider implementing file size limits for videos
 * - Implement proper error handling for failed captures
 * 
 * @technical
 * - Uses MediaStream API for camera access
 * - Uses MediaRecorder API for video recording
 * - Implements proper stream cleanup
 * - Handles device orientation changes
 * - Uses canvas for photo capture
 */
function MediaCapture({ onCapture, onClose }: MediaCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  
  const [state, setState] = useState<MediaCaptureState>({
    isRecording: false,
    mode: 'photo',
    duration: 0,
    stream: null,
    error: null
  })

  const { duration, startTimer, stopTimer, resetTimer } = useTimer()

  const stopCurrentStream = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      setState(prev => ({ ...prev, stream: null }))
    } catch (error) {
      console.error('Error stopping stream:', error)
    }
  }, [])

  const handleClose = useCallback(() => {
    stopCurrentStream()
    onClose()
  }, [onClose, stopCurrentStream])

  const initializeCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: state.mode === 'video'
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = newStream
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) return reject()
          
          const handleLoadedMetadata = () => {
            videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata)
            videoRef.current?.play()
              .then(() => resolve())
              .catch(reject)
          }
          
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
        })
      }
      
      setState(prev => ({ ...prev, stream: newStream, error: null }))
    } catch (error) {
      console.error('Camera initialization error:', error)
      stopCurrentStream()
      setState(prev => ({ ...prev, error: error as Error }))
    }
  }, [state.mode])

  const toggleMode = useCallback(() => {
    stopCurrentStream()
    setState(prev => ({ ...prev, mode: prev.mode === 'photo' ? 'video' : 'photo' }))
  }, [stopCurrentStream])

  const startRecording = useCallback(() => {
    if (!state.stream) return

    try {
      const mediaRecorder = new MediaRecorder(state.stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000) // Record in 1-second chunks
      startTimer()
      setState(prev => ({ ...prev, isRecording: true }))
    } catch (error) {
      console.error('Recording error:', error)
      setState(prev => ({ ...prev, error: error as Error }))
    }
  }, [state.stream, startTimer])

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return

    mediaRecorderRef.current.stop()
    stopTimer()
    setState(prev => ({ ...prev, isRecording: false }))

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
      
      onCapture({
        id: crypto.randomUUID(),
        file,
        type: 'video',
        timestamp: Date.now(),
        duration
      })
      
      resetTimer()
      chunksRef.current = []
      handleClose()
    }
  }, [duration, onCapture, stopTimer, resetTimer, handleClose])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    context.drawImage(videoRef.current, 0, 0)
    
    canvas.toBlob((blob) => {
      if (!blob) return
      
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      onCapture({
        id: crypto.randomUUID(),
        file,
        type: 'photo',
        timestamp: Date.now()
      })
      
      handleClose()
    }, 'image/jpeg', 0.95)
  }, [onCapture, handleClose])

  // Initialize camera only on mount
  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (mounted) {
        await initializeCamera()
      }
    }

    init()

    return () => {
      mounted = false
      stopCurrentStream()
    }
  }, [initializeCamera])

  // Handle mode changes separately
  useEffect(() => {
    if (state.mode && !state.isRecording) {
      initializeCamera()
    }
  }, [state.mode, initializeCamera, state.isRecording])

  if (state.error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-center">
          <p>Failed to access camera: {state.error.message}</p>
          <Button onClick={handleClose} variant="ghost" className="mt-4">
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="flex gap-2 p-1 rounded-full bg-black/20 backdrop-blur-sm">
          <MediaModeTab
            mode="photo"
            isSelected={state.mode === 'photo'}
            onClick={() => toggleMode()}
            disabled={state.isRecording}
          />
          <MediaModeTab
            mode="video"
            isSelected={state.mode === 'video'}
            onClick={() => toggleMode()}
            disabled={state.isRecording}
          />
        </div>
      </div>
      
      <div className="absolute top-4 right-4">
        {!state.isRecording && (
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </Button>
        )}
      </div>

      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-4">
        {state.isRecording && (
          <div className="text-white bg-red-500 px-4 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </div>
        )}
        
        <Button
          onClick={state.mode === 'photo' ? capturePhoto : state.isRecording ? stopRecording : startRecording}
          variant="ghost"
          size="icon"
          className={cn(
            "w-16 h-16 rounded-full",
            state.isRecording ? "bg-red-500" : "bg-white",
            state.isRecording && "animate-pulse"
          )}
        />
      </div>
    </div>
  )
}

/**
 * Tab interface for switching between photo and video modes
 * 
 * @internal
 * @component
 */
function MediaModeTab({ mode, isSelected, onClick, disabled }: MediaModeTabProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-2 rounded-full text-sm font-medium transition-all",
        "flex items-center gap-2",
        isSelected
          ? "bg-white text-black"
          : "bg-black/30 text-white hover:bg-black/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {mode === 'photo' ? (
        <>
          <Camera className="h-4 w-4" />
          Photo
        </>
      ) : (
        <>
          <Video className="h-4 w-4" />
          Video
        </>
      )}
    </button>
  )
}

export { MediaCapture }