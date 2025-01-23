import { ArrowLeft, Monitor, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { type ThemePreference, getUserThemePreference, setUserThemePreference } from '../lib/theme'
import { supabase } from '../lib/supabase'

interface SettingsProps {
  onBack: () => void
  darkMode: boolean
  onThemeChange: (theme: ThemePreference) => void
  showWelcomeSplash: boolean
  onWelcomeSplashChange: (show: boolean) => void
}

export default function Settings({ 
  onBack, 
  darkMode, 
  onThemeChange,
  showWelcomeSplash,
  onWelcomeSplashChange
}: SettingsProps) {
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const preference = await getUserThemePreference(user.id)
        setThemePreference(preference)
      }
      setLoading(false)
    }
    
    loadPreferences()
  }, [])

  const handleThemeChange = async (preference: ThemePreference) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setThemePreference(preference)
      await setUserThemePreference(user.id, preference)
      onThemeChange(preference)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">Ajustes</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-gray-800">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Apariencia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  themePreference === 'system'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <Monitor className={`w-6 h-6 ${
                  themePreference === 'system'
                    ? 'text-blue-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Sistema
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Sigue la configuración del dispositivo
                </div>
              </button>
              
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  themePreference === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <Sun className={`w-6 h-6 ${
                  themePreference === 'light'
                    ? 'text-blue-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Claro
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Siempre usar modo claro
                </div>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  themePreference === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <Moon className={`w-6 h-6 ${
                  themePreference === 'dark'
                    ? 'text-blue-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Oscuro
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Siempre usar modo oscuro
                </div>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Pantalla de bienvenida
            </h3>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWelcomeSplash}
                  onChange={(e) => {
                    // Actualizar la preferencia en la base de datos
                    onWelcomeSplashChange(e.target.checked)
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Mostrar pantalla de bienvenida
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}