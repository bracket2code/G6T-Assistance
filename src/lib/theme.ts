import { supabase } from './supabase'

export type ThemePreference = 'system' | 'light' | 'dark'

export async function getUserThemePreference(userId: string): Promise<ThemePreference> {
  const { data, error } = await supabase
    .from('users')
    .select('theme_preference')
    .eq('id', userId)
    .single()

  if (error || !data?.theme_preference) {
    return 'system'
  }

  return data.theme_preference as ThemePreference
}

export async function setUserThemePreference(userId: string, preference: ThemePreference) {
  const { error } = await supabase
    .from('users')
    .update({ theme_preference: preference })
    .eq('id', userId)

  if (error) {
    console.error('Error saving theme preference:', error)
  }
}

export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setupThemeListener(callback: (isDark: boolean) => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }

  mediaQuery.addEventListener('change', handleChange)
  return () => mediaQuery.removeEventListener('change', handleChange)
}