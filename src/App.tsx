import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSessionRefresh } from './hooks/useSessionRefresh'
import { useTheme } from './hooks/useTheme'
import { useWelcomeSplash } from './hooks/useWelcomeSplash'
import WelcomeSplash from './components/WelcomeSplash'
import { supabase } from './lib/supabase'
import { handleRequest } from './lib/utils'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import AttendanceApp from './features/attendance/AttendanceApp'
import Profile from './components/Profile'
import Settings from './components/Settings'
import Reports from './components/Reports'
import { getUserThemePreference } from './lib/theme'

type User = {
  id: string
  email: string
  role: string
}

export default function App() {
  const { session, user, loading } = useAuth()
  const { showSplash, setShowWelcomeSplash, welcomeSplashEnabled } = useWelcomeSplash(user?.id)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const { darkMode, setDarkMode, themePreference, setThemePreference, updateTheme } = useTheme('system')

  useSessionRefresh(session)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  if (showSplash) {
    return (
      <WelcomeSplash
        name={user?.name || ''}
        alias={user?.alias}
      />
    )
  }

  if (showProfile) {
    return <Profile user={user} onBack={() => setShowProfile(false)} />
  }

  if (showSettings) {
    return (
      <Settings
        onBack={() => setShowSettings(false)}
        darkMode={darkMode}
        showWelcomeSplash={welcomeSplashEnabled}
        onWelcomeSplashChange={setShowWelcomeSplash}
        onThemeChange={(preference) => {
          setThemePreference(preference)
          updateTheme(preference)
        }}
      />
    )
  }

  if (showReports) {
    return <Reports onBack={() => setShowReports(false)} />
  }

  if (showAdmin) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />
  }

  return (
    <AttendanceApp 
      user={user || { id: session.user.id, email: session.user.email, role: 'user' }}
      darkMode={darkMode}
      onShowAdmin={() => (user?.role === 'admin' || user?.role === 'manager') && setShowAdmin(true)}
      onShowProfile={() => setShowProfile(true)}
      onShowSettings={() => setShowSettings(true)}
      onShowReports={() => setShowReports(true)}
      onToggleDarkMode={() => {
        const newMode = !darkMode
        setDarkMode(newMode)
        setThemePreference(newMode ? 'dark' : 'light')
      }}
    />
  )
}