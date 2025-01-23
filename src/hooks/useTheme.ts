import { useState, useEffect } from 'react'
import { type ThemePreference, getSystemTheme, setupThemeListener } from '../lib/theme'

export function useTheme(initialPreference: ThemePreference = 'system') {
  const [themePreference, setThemePreference] = useState<ThemePreference>(initialPreference)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return getSystemTheme() === 'dark'
    }
    return false
  })

  const updateTheme = (preference: ThemePreference) => {
    if (preference === 'system') {
      setDarkMode(getSystemTheme() === 'dark')
    } else {
      setDarkMode(preference === 'dark')
    }
  }

  useEffect(() => {
    if (themePreference === 'system') {
      const cleanup = setupThemeListener((isDark) => {
        setDarkMode(isDark)
      })
      return cleanup
    }
  }, [themePreference])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return {
    darkMode,
    setDarkMode,
    themePreference,
    setThemePreference,
    updateTheme
  }
}