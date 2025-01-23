import { useState, useEffect, useRef, type ReactNode } from 'react'

interface ClockProps {
  children: ReactNode
}

export default function RealTimeClock({ children }: ClockProps) {
  const [dateTime, setDateTime] = useState({ time: '', date: '' })
  const [visible, setVisible] = useState(false)
  const touchStartRef = useRef<{ x: number, y: number } | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const time = now.toLocaleTimeString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      
      const date = now.toLocaleDateString('es-ES', {
        timeZone: 'Europe/Madrid',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      
      setDateTime({ time, date })
    }

    if (visible) {
      updateTime()
      const interval = setInterval(updateTime, 1000)
      return () => clearInterval(interval)
    }
  }, [visible])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
      setVisible(true)
      
      // Clear existing timer if any
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      
      // Set new timer
      timerRef.current = window.setTimeout(() => {
        setVisible(false)
        timerRef.current = null
      }, 5000)
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  return (
    <>
      <div 
        className="flex items-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      {visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" style={{ backdropFilter: 'blur(8px)' }}>
          <button
            onClick={() => {
              setVisible(false)
              if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
              }
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-[90%] max-w-md text-center">
            <div className="text-lg text-white mb-4">
              {dateTime.date}
            </div>
            <div className="text-[min(15vw,6rem)] font-bold text-white font-mono tracking-wider">
            {dateTime.time}
            </div>
          </div>
        </div>
      )}
    </>
  )
}