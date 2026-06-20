import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isDemoMode } from '@/lib/utils'
import {
  demoProfile,
  demoExercises,
  demoWorkouts,
  demoSets,
  demoRuns,
  demoSleep,
  demoHealthMetrics,
  demoWaterLogs,
  demoJournal,
  demoPRs,
} from '@/lib/demo-data'
import type {
  UserProfile,
  Exercise,
  Workout,
  WorkoutSet,
  Run,
  SleepRecord,
  HealthMetric,
  WaterLog,
  JournalEntry,
  PersonalRecord,
} from '@/types'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<UserProfile | null> => {
      if (isDemoMode()) return demoProfile
      if (!isSupabaseConfigured || !supabase) return null
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (error) throw error
      return { ...data, email: user.email ?? '' } as UserProfile
    },
  })
}

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async (): Promise<Exercise[]> => {
      if (isDemoMode()) return demoExercises
      if (!supabase) return []
      const { data, error } = await supabase.from('exercises').select('*').order('name')
      if (error) throw error
      return data as Exercise[]
    },
  })
}

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async (): Promise<Workout[]> => {
      if (isDemoMode()) return demoWorkouts
      if (!supabase) return []
      const { data, error } = await supabase.from('workouts').select('*').order('started_at', { ascending: false })
      if (error) throw error
      return data as Workout[]
    },
  })
}

export function useWorkoutSets(workoutId?: string) {
  return useQuery({
    queryKey: ['workout-sets', workoutId],
    enabled: !!workoutId,
    queryFn: async (): Promise<WorkoutSet[]> => {
      if (isDemoMode()) return demoSets.filter((s) => s.workout_id === workoutId)
      if (!supabase || !workoutId) return []
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*, exercise:exercises(*)')
        .eq('workout_id', workoutId)
        .order('set_number')
      if (error) throw error
      return data as WorkoutSet[]
    },
  })
}

export function useAllWorkoutSets() {
  return useQuery({
    queryKey: ['all-workout-sets'],
    queryFn: async (): Promise<WorkoutSet[]> => {
      if (isDemoMode()) return demoSets
      if (!supabase) return []
      const { data, error } = await supabase.from('workout_sets').select('*, exercise:exercises(*)')
      if (error) throw error
      return data as WorkoutSet[]
    },
  })
}

export function useRuns() {
  return useQuery({
    queryKey: ['runs'],
    queryFn: async (): Promise<Run[]> => {
      if (isDemoMode()) return demoRuns
      if (!supabase) return []
      const { data, error } = await supabase.from('runs').select('*').order('date', { ascending: false })
      if (error) throw error
      return data as Run[]
    },
  })
}

export function useSleepRecords() {
  return useQuery({
    queryKey: ['sleep'],
    queryFn: async (): Promise<SleepRecord[]> => {
      if (isDemoMode()) return demoSleep
      if (!supabase) return []
      const { data, error } = await supabase.from('sleep_records').select('*').order('date', { ascending: false })
      if (error) throw error
      return data as SleepRecord[]
    },
  })
}

export function useHealthMetrics(type?: string) {
  return useQuery({
    queryKey: ['health-metrics', type],
    queryFn: async (): Promise<HealthMetric[]> => {
      if (isDemoMode()) {
        return type ? demoHealthMetrics.filter((m) => m.metric_type === type) : demoHealthMetrics
      }
      if (!supabase) return []
      let q = supabase.from('health_metrics').select('*').order('date', { ascending: false })
      if (type) q = q.eq('metric_type', type)
      const { data, error } = await q
      if (error) throw error
      return data as HealthMetric[]
    },
  })
}

export function useWaterLogs() {
  return useQuery({
    queryKey: ['water-logs'],
    queryFn: async (): Promise<WaterLog[]> => {
      if (isDemoMode()) return demoWaterLogs
      if (!supabase) return []
      const { data, error } = await supabase.from('water_logs').select('*').order('logged_at', { ascending: false })
      if (error) throw error
      return data as WaterLog[]
    },
  })
}

export function useJournalEntries() {
  return useQuery({
    queryKey: ['journal'],
    queryFn: async (): Promise<JournalEntry[]> => {
      if (isDemoMode()) return demoJournal
      if (!supabase) return []
      const { data, error } = await supabase.from('journal_entries').select('*').order('date', { ascending: false })
      if (error) throw error
      return data as JournalEntry[]
    },
  })
}

export function usePRs() {
  return useQuery({
    queryKey: ['prs'],
    queryFn: async (): Promise<PersonalRecord[]> => {
      if (isDemoMode()) return demoPRs
      if (!supabase) return []
      // Compute PRs from workout_sets
      const { data, error } = await supabase
        .from('workout_sets')
        .select('weight, reps, exercise_id, created_at, exercise:exercises(name)')
        .eq('set_type', 'working')
        .order('weight', { ascending: false })
      if (error) throw error
      const seen = new Map<string, PersonalRecord>()
      for (const row of data ?? []) {
        const exId = row.exercise_id as string
        if (!seen.has(exId)) {
          seen.set(exId, {
            exercise_id: exId,
            exercise_name: (row.exercise as { name: string })?.name ?? 'Unknown',
            max_weight: row.weight,
            reps: row.reps,
            achieved_at: row.created_at,
          })
        }
      }
      return Array.from(seen.values())
    },
  })
}

export function useAddWaterLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (amount_ml: number) => {
      if (isDemoMode()) {
        demoWaterLogs.unshift({
          id: `water-${Date.now()}`,
          user_id: 'demo-user-id',
          logged_at: new Date().toISOString(),
          amount_ml,
        })
        return
      }
      if (!supabase) throw new Error('Not configured')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('water_logs').insert({ user_id: user.id, amount_ml })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['water-logs'] }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (isDemoMode()) {
        Object.assign(demoProfile, updates)
        return
      }
      if (!supabase) throw new Error('Not configured')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('users').update(updates).eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

export function useSaveJournalEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entry: { date: string; content_html: string; mood: number; tags: string[] }) => {
      if (isDemoMode()) {
        const existing = demoJournal.findIndex((e) => e.date === entry.date)
        const newEntry: JournalEntry = {
          id: existing >= 0 ? demoJournal[existing]!.id : `journal-${Date.now()}`,
          user_id: 'demo-user-id',
          ...entry,
          mood: entry.mood as 1 | 2 | 3 | 4 | 5,
        }
        if (existing >= 0) demoJournal[existing] = newEntry
        else demoJournal.unshift(newEntry)
        return
      }
      if (!supabase) throw new Error('Not configured')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('journal_entries').upsert({
        user_id: user.id,
        ...entry,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal'] }),
  })
}

export function useCreateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      if (isDemoMode()) {
        const wo: Workout = {
          id: `wo-${Date.now()}`,
          user_id: 'demo-user-id',
          name,
          started_at: new Date().toISOString(),
          ended_at: null,
          notes: null,
        }
        demoWorkouts.unshift(wo)
        return wo
      }
      if (!supabase) throw new Error('Not configured')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('workouts')
        .insert({ user_id: user.id, name })
        .select()
        .single()
      if (error) throw error
      return data as Workout
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useAddWorkoutSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (set: Omit<WorkoutSet, 'id'>) => {
      if (isDemoMode()) {
        demoSets.push({ ...set, id: `set-${Date.now()}` })
        return
      }
      if (!supabase) throw new Error('Not configured')
      const { error } = await supabase.from('workout_sets').insert(set)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['workout-sets', vars.workout_id] })
      qc.invalidateQueries({ queryKey: ['all-workout-sets'] })
      qc.invalidateQueries({ queryKey: ['prs'] })
    },
  })
}

export function useFinishWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (workoutId: string) => {
      if (isDemoMode()) {
        const wo = demoWorkouts.find((w) => w.id === workoutId)
        if (wo) wo.ended_at = new Date().toISOString()
        return
      }
      if (!supabase) throw new Error('Not configured')
      const { error } = await supabase
        .from('workouts')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', workoutId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useAddManualRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (run: Omit<Run, 'id' | 'user_id' | 'strava_id'>) => {
      if (isDemoMode()) {
        demoRuns.unshift({ ...run, id: `run-${Date.now()}`, user_id: 'demo-user-id', strava_id: null })
        return
      }
      if (!supabase) throw new Error('Not configured')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('runs').insert({ ...run, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['runs'] }),
  })
}
