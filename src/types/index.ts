export type UnitPreference = 'kg' | 'lbs'
export type DistanceUnit = 'km' | 'miles'
export type SetType = 'warmup' | 'working' | 'drop'
export type HealthMetricType = 'vo2max' | 'resting_hr' | 'steps' | 'stress' | 'body_battery'
export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All'

export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  unit_preference: UnitPreference
  distance_unit: DistanceUnit
  water_goal_ml: number
  strava_connected: boolean
  garmin_connected: boolean
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  muscle_group: string
  equipment: string | null
  is_custom: boolean
  user_id: string | null
}

export interface Workout {
  id: string
  user_id: string
  name: string
  started_at: string
  ended_at: string | null
  notes: string | null
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  set_number: number
  set_type: SetType
  weight: number
  reps: number
  rpe: number | null
  exercise?: Exercise
}

export interface WorkoutWithSets extends Workout {
  sets: WorkoutSet[]
}

export interface PersonalRecord {
  exercise_id: string
  exercise_name: string
  max_weight: number
  reps: number
  achieved_at: string
}

export interface Run {
  id: string
  user_id: string
  strava_id: number | null
  date: string
  distance_m: number
  duration_s: number
  pace_s_per_km: number
  elevation_m: number | null
  avg_hr: number | null
  polyline: string | null
  source: 'strava' | 'manual'
  name?: string
}

export interface SleepRecord {
  id: string
  user_id: string
  garmin_id: string | null
  date: string
  total_sleep_s: number
  deep_s: number
  light_s: number
  rem_s: number
  awake_s: number
  sleep_score: number | null
  hrv: number | null
}

export interface HealthMetric {
  id: string
  user_id: string
  date: string
  metric_type: HealthMetricType
  value: number
}

export interface WaterLog {
  id: string
  user_id: string
  logged_at: string
  amount_ml: number
}

export interface JournalEntry {
  id: string
  user_id: string
  date: string
  content_html: string
  mood: MoodLevel
  tags: string[]
}

export interface IntegrationTokens {
  strava_access_token?: string
  strava_refresh_token?: string
  strava_expires_at?: number
  garmin_access_token?: string
  garmin_refresh_token?: string
}

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '😴',
  2: '😐',
  3: '🙂',
  4: '😄',
  5: '🔥',
}

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Exhausted',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
}

export const DEFAULT_TAGS = ['recovery', 'stressed', 'great session', 'tired', 'motivated', 'sore']

export const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  All: null,
}
