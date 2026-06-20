-- FitTrack initial schema migration

-- Custom types
CREATE TYPE set_type AS ENUM ('warmup', 'working', 'drop');
CREATE TYPE health_metric_type AS ENUM ('vo2max', 'resting_hr', 'steps', 'stress', 'body_battery');
CREATE TYPE run_source AS ENUM ('strava', 'manual');

-- User profiles (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  unit_preference TEXT NOT NULL DEFAULT 'kg' CHECK (unit_preference IN ('kg', 'lbs')),
  distance_unit TEXT NOT NULL DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles')),
  water_goal_ml INTEGER NOT NULL DEFAULT 2500,
  strava_connected BOOLEAN NOT NULL DEFAULT FALSE,
  garmin_connected BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Integration tokens (server-side only via RLS)
CREATE TABLE public.integration_tokens (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_expires_at BIGINT,
  garmin_access_token TEXT,
  garmin_refresh_token TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises library
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workouts
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout sets
CREATE TABLE public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  set_number INTEGER NOT NULL,
  set_type set_type NOT NULL DEFAULT 'working',
  weight NUMERIC(8,2) NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  rpe INTEGER CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runs
CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  strava_id BIGINT UNIQUE,
  date DATE NOT NULL,
  distance_m NUMERIC(10,2) NOT NULL,
  duration_s INTEGER NOT NULL,
  pace_s_per_km NUMERIC(8,2) NOT NULL,
  elevation_m NUMERIC(8,2),
  avg_hr INTEGER,
  polyline TEXT,
  source run_source NOT NULL DEFAULT 'manual',
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sleep records
CREATE TABLE public.sleep_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  garmin_id TEXT,
  date DATE NOT NULL,
  total_sleep_s INTEGER NOT NULL,
  deep_s INTEGER NOT NULL DEFAULT 0,
  light_s INTEGER NOT NULL DEFAULT 0,
  rem_s INTEGER NOT NULL DEFAULT 0,
  awake_s INTEGER NOT NULL DEFAULT 0,
  sleep_score INTEGER,
  hrv NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Health metrics
CREATE TABLE public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_type health_metric_type NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date, metric_type)
);

-- Water logs
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0)
);

-- Journal entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content_html TEXT NOT NULL DEFAULT '',
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_workouts_user_started ON public.workouts(user_id, started_at DESC);
CREATE INDEX idx_workout_sets_workout ON public.workout_sets(workout_id);
CREATE INDEX idx_runs_user_date ON public.runs(user_id, date DESC);
CREATE INDEX idx_sleep_user_date ON public.sleep_records(user_id, date DESC);
CREATE INDEX idx_health_metrics_user_date ON public.health_metrics(user_id, date DESC);
CREATE INDEX idx_water_logs_user_logged ON public.water_logs(user_id, logged_at DESC);
CREATE INDEX idx_journal_user_date ON public.journal_entries(user_id, date DESC);
CREATE INDEX idx_exercises_name ON public.exercises(name);

-- Seed default exercises
INSERT INTO public.exercises (name, muscle_group, equipment, is_custom) VALUES
  ('Bench Press', 'Chest', 'Barbell', FALSE),
  ('Squat', 'Legs', 'Barbell', FALSE),
  ('Deadlift', 'Back', 'Barbell', FALSE),
  ('Pull-up', 'Back', 'Bodyweight', FALSE),
  ('Overhead Press', 'Shoulders', 'Barbell', FALSE),
  ('Barbell Row', 'Back', 'Barbell', FALSE),
  ('Lunges', 'Legs', 'Dumbbell', FALSE),
  ('Bicep Curls', 'Arms', 'Dumbbell', FALSE),
  ('Tricep Extensions', 'Arms', 'Cable', FALSE),
  ('Leg Press', 'Legs', 'Machine', FALSE);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Integration tokens — no client access (service role only)
CREATE POLICY "No client access to tokens" ON public.integration_tokens FOR ALL USING (FALSE);

-- Exercises policies
CREATE POLICY "Anyone can view default exercises" ON public.exercises FOR SELECT USING (is_custom = FALSE OR user_id = auth.uid());
CREATE POLICY "Users can insert custom exercises" ON public.exercises FOR INSERT WITH CHECK (user_id = auth.uid() AND is_custom = TRUE);
CREATE POLICY "Users can update own custom exercises" ON public.exercises FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own custom exercises" ON public.exercises FOR DELETE USING (user_id = auth.uid());

-- Workouts policies
CREATE POLICY "Users manage own workouts" ON public.workouts FOR ALL USING (auth.uid() = user_id);

-- Workout sets policies
CREATE POLICY "Users manage own sets" ON public.workout_sets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid()));

-- Runs policies
CREATE POLICY "Users manage own runs" ON public.runs FOR ALL USING (auth.uid() = user_id);

-- Sleep policies
CREATE POLICY "Users manage own sleep" ON public.sleep_records FOR ALL USING (auth.uid() = user_id);

-- Health metrics policies
CREATE POLICY "Users manage own health metrics" ON public.health_metrics FOR ALL USING (auth.uid() = user_id);

-- Water logs policies
CREATE POLICY "Users manage own water logs" ON public.water_logs FOR ALL USING (auth.uid() = user_id);

-- Journal policies
CREATE POLICY "Users manage own journal" ON public.journal_entries FOR ALL USING (auth.uid() = user_id);
