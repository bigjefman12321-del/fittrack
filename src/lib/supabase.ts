import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from './utils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('your-project')

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function invokeEdgeFunction<T>(
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  if (isDemoMode()) {
    throw new Error('Edge functions unavailable in demo mode')
  }
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw error
  return data as T
}
