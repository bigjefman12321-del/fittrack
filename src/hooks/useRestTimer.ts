import { useEffect } from 'react'
import { useWorkoutSessionStore } from '@/stores'
import { playRestTimerSound } from '@/lib/utils'

export function useRestTimer() {
  const { restSeconds, restRunning, tickRest } = useWorkoutSessionStore()

  useEffect(() => {
    if (!restRunning) return
    const interval = setInterval(() => {
      tickRest()
    }, 1000)
    return () => clearInterval(interval)
  }, [restRunning, tickRest])

  useEffect(() => {
    if (restRunning && restSeconds === 0) {
      playRestTimerSound()
    }
  }, [restRunning, restSeconds])

  return useWorkoutSessionStore()
}
