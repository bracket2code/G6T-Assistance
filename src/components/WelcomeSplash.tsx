import { useState } from 'react'

interface WelcomeSplashProps {
  name: string
  alias?: string
}

export default function WelcomeSplash({ name, alias }: WelcomeSplashProps) {
  const [date] = useState(() => {
    const now = new Date()
    return now.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  })

  const displayName = alias || name

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Bienvenido{displayName ? `, ${displayName}` : ''}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {date}
        </p>
      </div>
    </div>
  )
}