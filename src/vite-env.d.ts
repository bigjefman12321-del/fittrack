/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEMO_MODE: string
  readonly VITE_APP_URL: string
  readonly VITE_STRAVA_CLIENT_ID: string
  readonly VITE_GARMIN_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
