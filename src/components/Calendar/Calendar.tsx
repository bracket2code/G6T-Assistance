import { useState, useRef, useEffect } from 'react'
import { type Priority } from '../../types/attendance'

interface WeeklyTotal {
  startX: number
  endX: number
  total: string
  weekIndex: number
  timestamp: number
}

interface CalendarProps {
  selectedDate: string
  dailyNotes: Record<string, Array<{ priority: Priority }>>
  records: Record<string, Record<string, Array<{ checkInTime: string, checkOutTime: string }>>>
  onDateSelect: (date: string) => void
}

export default function Calendar({ 
  selectedDate, 
  dailyNotes, 
  records,
  onDateSelect 
}: CalendarProps) {
  const [weeklyTotal, setWeeklyTotal] = useState<WeeklyTotal | null>(null)
  const touchStartRef = useRef<{ x: number, y: number, weekIndex: number } | null>(null)
  
  useEffect(() => {
    if (weeklyTotal) {
      const timer = setTimeout(() => {
        setWeeklyTotal(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [weeklyTotal])

  const getHighestPriority = (date: string): Priority => {
    const notes = dailyNotes[date] || []
    if (notes.some(note => note.priority === 'high')) return 'high'
    if (notes.some(note => note.priority === 'medium')) return 'medium'
    if (notes.some(note => note.priority === 'low')) return 'low'
    if (notes.some(note => note.priority === 'vacation')) return 'vacation'
    return null
  }

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-200'
      case 'low': return 'bg-blue-500'
      case 'vacation': return 'bg-purple-500'
      default: return 'bg-blue-500'
    }
  }

  const calculateHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0
    const [inHours, inMinutes] = checkIn.split(':').map(Number)
    const [outHours, outMinutes] = checkOut.split(':').map(Number)
    return ((outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)) / 60
  }

  const getTotalHoursForDate = (date: string) => {
    let total = 0
    const dayRecords = records[date] || {}
    Object.values(dayRecords).forEach(shifts => {
      shifts?.forEach(shift => {
        total += calculateHours(shift.checkInTime, shift.checkOutTime)
      })
    })
    return total.toFixed(1)
  }

  const getWeeklyTotal = (weekDays: (Date | null)[]) => {
    let total = 0
    weekDays.forEach(day => {
      if (day) {
        const date = day.toISOString().slice(0, 10)
        total += parseFloat(getTotalHoursForDate(date))
      }
    })
    return total.toFixed(1)
  }

  const getMonthDays = () => {
    const date = new Date(selectedDate)
    const month = date.getMonth()
    const year = date.getFullYear()
    const days: (Date | null)[] = [] 

    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    firstDay.setHours(12) // Set to noon to avoid DST issues
    const firstDayWeekday = firstDay.getDay() || 7

    // Add days from previous month
    const lastMonthLastDay = new Date(year, month, 0)
    lastMonthLastDay.setHours(12)
    const daysFromPrevMonth = firstDayWeekday - 1
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, lastMonthLastDay.getDate() - i)
      day.setHours(12)
      days.push(day)
    }
    
    // Add days from current month
    const lastDay = new Date(year, month + 1, 0)
    lastDay.setHours(12)
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i)
      currentDate.setHours(12)
      days.push(currentDate)
    }

    // Add days from next month
    const lastDayWeekday = lastDay.getDay() || 7
    const daysFromNextMonth = 7 - lastDayWeekday
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const day = new Date(year, month + 1, i)
      day.setHours(12)
      days.push(day)
    }

    return days
  }

  const handleTouchStart = (e: React.TouchEvent, weekIndex: number) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      weekIndex
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const days = getMonthDays()
      const weekStart = touchStartRef.current.weekIndex * 7
      const weekDays = days.slice(weekStart, weekStart + 7)
      const total = getWeeklyTotal(weekDays)

      setWeeklyTotal({
        startX: Math.min(touchStartRef.current.x, touch.clientX),
        endX: Math.max(touchStartRef.current.x, touch.clientX),
        total,
        weekIndex: touchStartRef.current.weekIndex,
        timestamp: Date.now()
      })

      touchStartRef.current = null
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  const days = getMonthDays()
  const weeks = Math.ceil(days.length / 7)

  return (
    <div className="relative">
      <div className="grid grid-cols-7 gap-1 mb-6">
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
        <div key={day} className="text-center py-2 px-1 bg-gray-100 font-medium text-sm dark:bg-gray-800 dark:text-gray-300">
          {day}
        </div>
      ))}
      {Array.from({ length: weeks }).map((_, weekIndex) => (
        <div 
          key={weekIndex} 
          className="contents"
          onTouchStart={(e) => handleTouchStart(e, weekIndex)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => (
            <div
              key={weekIndex * 7 + dayIndex}
              onClick={() => {
                if (day) {
                  const selectedDay = new Date(day.getFullYear(), day.getMonth(), day.getDate())
                  selectedDay.setHours(12)
                  const currentMonth = new Date(selectedDate).getMonth()
                  if (day.getMonth() !== currentMonth) {
                    // If clicking on a day from adjacent month, change the month too
                    onDateSelect(selectedDay.toISOString().slice(0, 10))
                  } else {
                    onDateSelect(selectedDay.toISOString().slice(0, 10))
                  }
                }
              }}
              className={`p-1 sm:p-2 border text-center min-h-[3.5rem] sm:min-h-16 cursor-pointer dark:border-gray-700 dark:text-gray-300 ${
                day ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              } ${day?.toISOString().slice(0, 10) === selectedDate ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' : ''}
              ${day && day.getMonth() !== new Date(selectedDate).getMonth() ? 'opacity-40' : ''}`}
            >
          {day && day.toISOString && (
            <>
              <div className="relative font-medium text-2xl mt-1 dark:text-gray-200">
                {day.getDate()}
                {getHighestPriority(day.toISOString().slice(0, 10)) && (
                  <div className={`absolute top-0 right-0 w-2 h-2 ${
                    getPriorityColor(getHighestPriority(day.toISOString().slice(0, 10)))
                  } rounded-full`} />
                )}
              </div>
              <div className="text-sm sm:text-base font-medium text-blue-700 dark:text-blue-300">
                {getTotalHoursForDate(day.toISOString().slice(0, 10))}h
              </div>
            </>
          )}
            </div>
          ))}
        </div>
      ))}
      </div>
      {weeklyTotal && (
        <div 
          className="absolute left-0 right-0 bg-blue-500 text-white text-xl font-bold py-2 text-center rounded-lg shadow-lg transition-all duration-300 dark:bg-blue-600"
          style={{
            top: `${Math.floor(weeklyTotal.weekIndex / weeks * 100)}%`,
            transform: 'translateY(-50%)',
            opacity: 0.9
          }}
        >
          Total semana: {weeklyTotal.total}h
        </div>
      )}
    </div>
  )
}