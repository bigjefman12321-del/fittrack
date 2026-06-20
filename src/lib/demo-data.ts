import { subDays, format } from 'date-fns'
import type {
  Exercise,
  Workout,
  WorkoutSet,
  Run,
  SleepRecord,
  HealthMetric,
  WaterLog,
  JournalEntry,
  UserProfile,
  PersonalRecord,
} from '@/types'

const USER_ID = 'demo-user-id'

export const demoProfile: UserProfile = {
  id: USER_ID,
  email: 'demo@fittrack.app',
  display_name: 'Demo Athlete',
  unit_preference: 'kg',
  distance_unit: 'km',
  water_goal_ml: 2500,
  strava_connected: true,
  garmin_connected: true,
  created_at: subDays(new Date(), 90).toISOString(),
}

export const demoExercises: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', is_custom: false, user_id: null },
  { id: 'ex-2', name: 'Squat', muscle_group: 'Legs', equipment: 'Barbell', is_custom: false, user_id: null },
  { id: 'ex-3', name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', is_custom: false, user_id: null },
  { id: 'ex-4', name: 'Pull-up', muscle_group: 'Back', equipment: 'Bodyweight', is_custom: false, user_id: null },
  { id: 'ex-5', name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell', is_custom: false, user_id: null },
  { id: 'ex-6', name: 'Barbell Row', muscle_group: 'Back', equipment: 'Barbell', is_custom: false, user_id: null },
  { id: 'ex-7', name: 'Lunges', muscle_group: 'Legs', equipment: 'Dumbbell', is_custom: false, user_id: null },
  { id: 'ex-8', name: 'Bicep Curls', muscle_group: 'Arms', equipment: 'Dumbbell', is_custom: false, user_id: null },
  { id: 'ex-9', name: 'Tricep Extensions', muscle_group: 'Arms', equipment: 'Cable', is_custom: false, user_id: null },
  { id: 'ex-10', name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine', is_custom: false, user_id: null },
]

function generateWorkouts(): Workout[] {
  const workouts: Workout[] = []
  const names = ['Push Day', 'Pull Day', 'Leg Day', 'Upper Body', 'Full Body']
  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i * 2 + (i % 3))
    const started = new Date(date)
    started.setHours(7 + (i % 3), 30, 0)
    const ended = new Date(started)
    ended.setMinutes(ended.getMinutes() + 45 + (i % 30))
    workouts.push({
      id: `wo-${i}`,
      user_id: USER_ID,
      name: names[i % names.length]!,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      notes: i % 5 === 0 ? 'Felt strong today' : null,
    })
  }
  return workouts
}

function generateSets(workouts: Workout[]): WorkoutSet[] {
  const sets: WorkoutSet[] = []
  workouts.forEach((wo, wi) => {
    const exerciseCount = 3 + (wi % 3)
    for (let e = 0; e < exerciseCount; e++) {
      const ex = demoExercises[e % demoExercises.length]!
      const setCount = 3 + (wi % 2)
      for (let s = 0; s < setCount; s++) {
        sets.push({
          id: `set-${wi}-${e}-${s}`,
          workout_id: wo.id,
          exercise_id: ex.id,
          set_number: s + 1,
          set_type: s === 0 ? 'warmup' : s === setCount - 1 && wi % 4 === 0 ? 'drop' : 'working',
          weight: 40 + e * 15 + s * 5 + wi * 0.5,
          reps: s === 0 ? 10 : 6 + (s % 4),
          rpe: s === 0 ? null : 6 + (s % 4),
          exercise: ex,
        })
      }
    }
  })
  return sets
}

function generateRuns(): Run[] {
  const runs: Run[] = []
  for (let i = 0; i < 45; i++) {
    const date = subDays(new Date(), i * 2)
    const distance = 3000 + (i % 10) * 500 + Math.random() * 2000
    const duration = distance * (0.28 + (i % 5) * 0.02)
    runs.push({
      id: `run-${i}`,
      user_id: USER_ID,
      strava_id: 1000000 + i,
      date: format(date, 'yyyy-MM-dd'),
      distance_m: Math.round(distance),
      duration_s: Math.round(duration),
      pace_s_per_km: Math.round(duration / (distance / 1000)),
      elevation_m: Math.round(20 + (i % 8) * 15),
      avg_hr: 140 + (i % 20),
      polyline: null,
      source: 'strava',
      name: `${['Morning', 'Evening', 'Trail', 'Tempo', 'Easy'][i % 5]} Run`,
    })
  }
  return runs
}

function generateSleep(): SleepRecord[] {
  const records: SleepRecord[] = []
  for (let i = 0; i < 60; i++) {
    const date = subDays(new Date(), i)
    const total = 6 * 3600 + Math.round(Math.random() * 3 * 3600)
    records.push({
      id: `sleep-${i}`,
      user_id: USER_ID,
      garmin_id: `g-${i}`,
      date: format(date, 'yyyy-MM-dd'),
      total_sleep_s: total,
      deep_s: Math.round(total * 0.2),
      light_s: Math.round(total * 0.45),
      rem_s: Math.round(total * 0.25),
      awake_s: Math.round(total * 0.1),
      sleep_score: 60 + Math.round(Math.random() * 35),
      hrv: 30 + Math.round(Math.random() * 40),
    })
  }
  return records
}

function generateHealthMetrics(): HealthMetric[] {
  const metrics: HealthMetric[] = []
  for (let i = 0; i < 60; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    metrics.push(
      { id: `hm-vo2-${i}`, user_id: USER_ID, date, metric_type: 'vo2max', value: 42 + (60 - i) * 0.05 + Math.random() * 2 },
      { id: `hm-hr-${i}`, user_id: USER_ID, date, metric_type: 'resting_hr', value: 52 + Math.round(Math.random() * 8) },
      { id: `hm-steps-${i}`, user_id: USER_ID, date, metric_type: 'steps', value: 6000 + Math.round(Math.random() * 8000) },
      { id: `hm-stress-${i}`, user_id: USER_ID, date, metric_type: 'stress', value: 20 + Math.round(Math.random() * 50) },
      { id: `hm-bb-${i}`, user_id: USER_ID, date, metric_type: 'body_battery', value: 30 + Math.round(Math.random() * 60) }
    )
  }
  return metrics
}

function generateWaterLogs(): WaterLog[] {
  const logs: WaterLog[] = []
  for (let d = 0; d < 90; d++) {
    const date = subDays(new Date(), d)
    const entries = 4 + Math.floor(Math.random() * 6)
    for (let e = 0; e < entries; e++) {
      const logged = new Date(date)
      logged.setHours(8 + e * 2, Math.round(Math.random() * 59))
      logs.push({
        id: `water-${d}-${e}`,
        user_id: USER_ID,
        logged_at: logged.toISOString(),
        amount_ml: [250, 500, 750][e % 3]!,
      })
    }
  }
  return logs
}

function generateJournal(): JournalEntry[] {
  const entries: JournalEntry[] = []
  const tags = ['recovery', 'great session', 'tired', 'motivated', 'stressed', 'sore']
  for (let i = 0; i < 45; i++) {
    const date = subDays(new Date(), i * 2)
    entries.push({
      id: `journal-${i}`,
      user_id: USER_ID,
      date: format(date, 'yyyy-MM-dd'),
      content_html: `<p>Day ${45 - i}: ${['Good training day', 'Rest day', 'Pushed hard', 'Feeling recovered', 'Need more sleep'][i % 5]}. Focus on consistency.</p>`,
      mood: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      tags: [tags[i % tags.length]!, tags[(i + 2) % tags.length]!].filter((t, idx, arr) => arr.indexOf(t) === idx),
    })
  }
  return entries
}

export const demoWorkouts = generateWorkouts()
export const demoSets = generateSets(demoWorkouts)
export const demoRuns = generateRuns()
export const demoSleep = generateSleep()
export const demoHealthMetrics = generateHealthMetrics()
export const demoWaterLogs = generateWaterLogs()
export const demoJournal = generateJournal()

export const demoPRs: PersonalRecord[] = [
  { exercise_id: 'ex-1', exercise_name: 'Bench Press', max_weight: 100, reps: 5, achieved_at: subDays(new Date(), 5).toISOString() },
  { exercise_id: 'ex-2', exercise_name: 'Squat', max_weight: 140, reps: 3, achieved_at: subDays(new Date(), 12).toISOString() },
  { exercise_id: 'ex-3', exercise_name: 'Deadlift', max_weight: 180, reps: 1, achieved_at: subDays(new Date(), 20).toISOString() },
]
