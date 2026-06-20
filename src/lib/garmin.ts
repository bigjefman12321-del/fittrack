import { invokeEdgeFunction } from './supabase'
import { isDemoMode } from './utils'

const GARMIN_CLIENT_ID = import.meta.env.VITE_GARMIN_CLIENT_ID ?? ''
const APP_URL = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'

export function getGarminAuthUrl(): string {
  const redirectUri = `${APP_URL}/auth/garmin/callback`
  return (
    `https://connect.garmin.com/oauthConfirm` +
    `?oauth_callback=${encodeURIComponent(redirectUri)}` +
    `&client_id=${GARMIN_CLIENT_ID}`
  )
}

export async function exchangeGarminCode(code: string): Promise<{ success: boolean }> {
  return invokeEdgeFunction('garmin-token-exchange', { code, redirect_uri: `${APP_URL}/auth/garmin/callback` })
}

export async function syncGarminHealth(): Promise<{ synced: number }> {
  if (isDemoMode()) return { synced: 0 }
  return invokeEdgeFunction('garmin-sync', {})
}

export async function disconnectGarmin(): Promise<void> {
  if (isDemoMode()) return
  await invokeEdgeFunction('garmin-disconnect', {})
}

export function isGarminConfigured(): boolean {
  return GARMIN_CLIENT_ID.length > 0 && !GARMIN_CLIENT_ID.includes('your-')
}
