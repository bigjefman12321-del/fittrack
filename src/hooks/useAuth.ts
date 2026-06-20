import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isDemoMode } from '@/lib/utils'
import { useAuthStore } from '@/stores'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { demoAuthenticated, setDemoAuthenticated } = useAuthStore()

  const isAuthenticated = isDemoMode()
    ? demoAuthenticated
    : !!session

  useEffect(() => {
    if (isDemoMode()) {
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isDemoMode()) {
      setDemoAuthenticated(true)
      return { error: null }
    }
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (isDemoMode()) {
      setDemoAuthenticated(true)
      return { error: null }
    }
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    return { error }
  }

  const signOut = async () => {
    if (isDemoMode()) {
      setDemoAuthenticated(false)
      return
    }
    if (supabase) await supabase.auth.signOut()
  }

  return { user, session, loading, isAuthenticated, signIn, signUp, signOut, isDemoMode: isDemoMode() }
}
