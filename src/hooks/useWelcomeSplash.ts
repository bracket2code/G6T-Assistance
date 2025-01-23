import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useWelcomeSplash(userId: string | undefined) {
  const [showSplash, setShowSplash] = useState(false)
  const [preference, setPreference] = useState(true)
  const [loading, setLoading] = useState(true)

  // Cargar preferencia inicial
  useEffect(() => {
    const loadPreference = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from('users')
          .select('show_welcome_splash')
          .eq('id', userId)
          .single()

        const initialPreference = data?.show_welcome_splash ?? true
        setPreference(initialPreference)
        // Solo mostrar el splash si estamos en la página principal y la preferencia está activada
        setShowSplash(window.location.pathname === '/' && initialPreference)
      } catch (error) {
        console.error('Error loading welcome splash preference:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreference()
  }, [userId])

  const setShowWelcomeSplash = async (show: boolean) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ show_welcome_splash: show })
        .eq('id', userId)

      if (error) throw error

      // Solo actualizar la preferencia, no mostrar el splash
      setPreference(show)
    } catch (error) {
      console.error('Error updating welcome splash preference:', error)
    }
  }

  // Ocultar el splash después de 3 segundos si está visible
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSplash])

  return {
    showSplash,
    setShowWelcomeSplash,
    welcomeSplashEnabled: preference
  }
}