import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { handleRequest } from '../lib/utils'
import type { User } from '../types/auth'

const SPLASH_DURATION = 3000 // 3 seconds

export function useAuth() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  // Effect to handle splash screen timing
  useEffect(() => {
    if (dataLoaded) {
      const timer = setTimeout(() => {
        setShowSplash(false)
      }, SPLASH_DURATION)
      return () => clearTimeout(timer)
    }
  }, [dataLoaded])

  const fetchUser = async (userId: string) => {
    const maxRetries = 3;
    let attempts = 0;
    let lastError = null;

    try {
      while (attempts < maxRetries) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, email, name, alias, roles:role_id(name)')
            .eq('id', userId)
            .maybeSingle()

          if (error) throw error

          if (data) {
            setUser({
              id: data.id,
              email: data.email,
              name: data.name,
              alias: data.alias,
              role: data.roles?.name || 'user'
            })
            return;
          }

          // If no data but no error, wait and retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          attempts++;
        } catch (error) {
          lastError = error;
          if (attempts === maxRetries - 1) break;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          attempts++;
        }
      }

      // If all retries failed but we have session data, create minimal user
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split('@')[0],
          alias: '',
          role: 'user'
        })
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      // Rethrow to trigger global error handler if needed
      throw error
    } finally {      
      setDataLoaded(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    const initSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        return
      }

      if (session) {
        localStorage.setItem('supabase.auth.token', session.access_token)
      }

      setSession(session)
      if (session) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    }

    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('supabase.auth.token', session.access_token)
      } else {
        localStorage.removeItem('supabase.auth.token')
      }

      setSession(session)
      if (session) {
        fetchUser(session.user.id)
      } else {
        setUser(null)
        setDataLoaded(true)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, user, loading, showSplash }
}