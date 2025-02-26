import { useState, useCallback, useRef } from 'react'

/**
 * Hook for managing a simple timer with start, stop, and reset functionality
 * 
 * @returns {Object} Timer controls and current duration
 * @property {number} duration - Current duration in seconds
 * @property {() => void} startTimer - Start or resume the timer
 * @property {() => void} stopTimer - Pause the timer
 * @property {() => void} resetTimer - Reset duration to zero
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { duration, startTimer, stopTimer, resetTimer } = useTimer()
 *   
 *   return (
 *     <div>
 *       Duration: {duration}s
 *       <button onClick={startTimer}>Start</button>
 *       <button onClick={stopTimer}>Stop</button>
 *       <button onClick={resetTimer}>Reset</button>
 *     </div>
 *   )
 * }
 * ```
 */
function useTimer() {
  const [duration, setDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTimer = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  const resetTimer = useCallback(() => {
    setDuration(0)
  }, [])

  return {
    duration,
    startTimer,
    stopTimer,
    resetTimer
  }
}

export { useTimer }