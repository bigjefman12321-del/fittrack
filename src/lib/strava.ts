import { invokeEdgeFunction } from './supabase'
import { isDemoMode } from './utils'

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID ?? ''
const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'

export function getStravaAuthUrl(): string {
  const redirectUri = `${APP_URL}/auth/strava/callback`
  const scope = 'activity:read_all'
  return (
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${STRAVA_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&approval_prompt=auto`
  )
}

export async function exchangeStravaCode(code: string): Promise<{ success: boolean }> {
  return invokeEdgeFunction('strava-token-exchange', { code, redirect_uri: `${APP_URL}/auth/strava/callback` })
}

export async function syncStravaActivities(): Promise<{ synced: number }> {
  if (isDemoMode()) return { synced: 0 }
  return invokeEdgeFunction('strava-sync', {})
}

export async function disconnectStrava(): Promise<void> {
  if (isDemoMode()) return
  await invokeEdgeFunction('strava-disconnect', {})
}

export function getStravaActivityUrl(stravaId: number): string {
  return `https://www.strava.com/activities/${stravaId}`
}

export function isStravaConfigured(): boolean {
  return STRAVA_CLIENT_ID.length > 0 && !STRAVA_CLIENT_ID.includes('your-')
}
