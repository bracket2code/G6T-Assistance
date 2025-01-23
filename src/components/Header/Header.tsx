import { Clock, Settings, UserCircle, FileBarChart, Building2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import UserMenu from './UserMenu'
import RealTimeClock from './Clock'

interface HeaderProps {
  user: {
    id: string
    email: string
    role: string
  }
  darkMode: boolean
  onShowAdmin: () => void
  onShowProfile: () => void
  onShowSettings: () => void
  onShowReports: () => void
  onToggleDarkMode: () => void
}

export default function Header({
  user,
  darkMode,
  onShowAdmin,
  onShowProfile,
  onShowSettings,
  onShowReports,
  onToggleDarkMode
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <RealTimeClock>
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold ml-2 dark:text-white">G6T-Assistance</h1>
          </div>
        </RealTimeClock>
      </div>
      <div className="flex items-center gap-3 relative">
        {(user.role === 'admin' || user.role === 'manager') && (
          <button
            onClick={onShowAdmin}
            className="flex items-center gap-2 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Panel de administración"
          >
            <Building2 className="h-5 w-5" />
          </button>
        )}
        <button
          onClick={onShowReports}
          className="flex items-center gap-2 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Informes"
        >
          <FileBarChart className="h-5 w-5" />
        </button>
        <button
          onClick={onShowSettings}
          className="flex items-center gap-2 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Ajustes de usuario"
        >
          <Settings className="h-5 w-5" />
        </button>
        <UserMenu
          darkMode={darkMode}
          user={user}
          onShowProfile={onShowProfile}
          onToggleDarkMode={onToggleDarkMode}
          onSignOut={() => supabase.auth.signOut()}
        />
      </div>
    </div>
  )
}