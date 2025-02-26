/**
 * Represents the available modes for media capture
 * @type 'photo' - For capturing still images
 * @type 'video' - For recording video with audio
 */
export type MediaMode = 'photo' | 'video'

/**
 * Internal state management for the MediaCapture component
 * @property isRecording - Whether video recording is in progress
 * @property mode - Current capture mode (photo/video)
 * @property duration - Current recording duration in seconds
 * @property stream - Active MediaStream instance
 * @property error - Any error that occurred during media operations
 */
export type MediaCaptureState = {
  isRecording: boolean
  mode: MediaMode
  duration: number
  stream: MediaStream | null
  error: Error | null
}

/**
 * Represents a captured media file with metadata
 * @property id - Unique identifier for the media file
 * @property file - The actual File object containing the media data
 * @property type - Whether this is a photo or video file
 * @property timestamp - Unix timestamp of when the media was captured
 * @property duration - Duration in seconds (only for video files)
 */
export type MediaFile = {
  id: string
  file: File
  type: MediaMode
  timestamp: number
  duration?: number
} 