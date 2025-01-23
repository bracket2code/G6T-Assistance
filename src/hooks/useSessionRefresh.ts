import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { handleRequest } from '../lib/utils'

export function useSessionRefresh(session: any) {
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && session) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (!currentSession) {
            localStorage.removeItem('supabase.auth.token')
            window.location.reload()
          }
        } catch (error) {
          console.error('Error checking session:', error)
          localStorage.removeItem('supabase.auth.token')
          window.location.reload()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    let refreshInterval: number | undefined
    
    if (session) {
      refreshInterval = window.setInterval(async () => {
        if (session) {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (!currentSession) {
            localStorage.removeItem('supabase.auth.token')
            window.location.reload()
          }
        }
      }, 60000)
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (refreshInterval) {
        window.clearInterval(refreshInterval)
      }
    }
  }, [session])
}