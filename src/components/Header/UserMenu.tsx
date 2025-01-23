import { useState } from 'react'
import { UserCircle } from 'lucide-react'

interface UserMenuProps {
  darkMode: boolean
  user: {
    name: string
    alias?: string
  }
  onShowProfile: () => void
  onToggleDarkMode: () => void
  onSignOut: () => void
}

export default function UserMenu({
  darkMode,
  user,
  onShowProfile,
  onToggleDarkMode,
  onSignOut
}: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const displayName = user.alias || user.name

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="relative flex items-center gap-2 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Perfil"
      >
        <UserCircle className="h-5 w-5" />
      </button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 divide-y divide-gray-100">
            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 text-left">
              Hola, {displayName}
            </div>
            <div>
              <button
                onClick={() => {
                  setShowMenu(false)
                  onShowProfile()
                }}
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left dark:text-gray-300 dark:hover:bg-gray-700 text-left"
              >
                Mi Perfil
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  onToggleDarkMode()
                }}
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left dark:text-gray-300 dark:hover:bg-gray-700 text-left"
              >
                {darkMode ? 'Modo claro' : 'Modo oscuro'}
              </button>
            </div>
            <div>
              <button
                onClick={onSignOut}
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left dark:text-gray-300 dark:hover:bg-gray-700 text-left"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}