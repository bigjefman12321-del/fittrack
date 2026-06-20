import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UnitPreference, DistanceUnit } from '@/types'

interface WorkoutSessionState {
  activeWorkoutId: string | null
  restSeconds: number
  restRunning: boolean
  setActiveWorkout: (id: string | null) => void
  startRest: (seconds: number) => void
  tickRest: () => void
  stopRest: () => void
}

export const useWorkoutSessionStore = create<WorkoutSessionState>((set) => ({
  activeWorkoutId: null,
  restSeconds: 0,
  restRunning: false,
  setActiveWorkout: (id) => set({ activeWorkoutId: id }),
  startRest: (seconds) => set({ restSeconds: seconds, restRunning: true }),
  tickRest: () =>
    set((s) => {
      if (s.restSeconds <= 1) return { restSeconds: 0, restRunning: false }
      return { restSeconds: s.restSeconds - 1 }
    }),
  stopRest: () => set({ restSeconds: 0, restRunning: false }),
}))

interface UIState {
  sidebarOpen: boolean
  timeRange: import('@/types').TimeRange
  toggleSidebar: () => void
  setTimeRange: (range: import('@/types').TimeRange) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  timeRange: '3M',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTimeRange: (timeRange) => set({ timeRange }),
}))

interface AuthState {
  demoAuthenticated: boolean
  setDemoAuthenticated: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      demoAuthenticated: false,
      setDemoAuthenticated: (v) => set({ demoAuthenticated: v }),
    }),
    { name: 'fittrack-auth' }
  )
)

interface WaterState {
  customAmount: number
  setCustomAmount: (n: number) => void
}

export const useWaterStore = create<WaterState>((set) => ({
  customAmount: 250,
  setCustomAmount: (customAmount) => set({ customAmount }),
}))

export type { UnitPreference, DistanceUnit }
