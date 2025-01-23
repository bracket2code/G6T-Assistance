import { useState, useRef } from 'react'
import { type MonthlyComparisonData } from '../types/attendance'

export function useMonthlyComparison(
  selectedDate: string,
  getTotalHoursForDate: (date: string) => string
) {
  const [monthComparison, setMonthComparison] = useState<MonthlyComparisonData | null>(null)
  const touchStartRef = useRef<{ x: number, y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return

    const madridNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const currentDate = new Date(selectedDate)
      const previousMonth = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
      const today = madridNow
      
      // Get total hours for current and previous month
      const currentMonthTotal = (() => {
        const date = currentDate
        const month = date.getMonth()
        const year = date.getFullYear()
        const lastDay = new Date(Date.UTC(year, month + 1, 0)).getDate()
        let total = 0
        
        for (let i = 1; i <= lastDay; i++) {
          const currentDate = new Date(Date.UTC(year, month, i)).toISOString().slice(0, 10)
          total += parseFloat(getTotalHoursForDate(currentDate))
        }
        
        return total.toFixed(1)
      })()

      const previousMonthTotal = (() => {
        const prevDate = previousMonth.toISOString().slice(0, 10)
        const prevMonth = previousMonth.getMonth()
        const prevYear = previousMonth.getFullYear()
        const lastDay = new Date(Date.UTC(prevYear, prevMonth + 1, 0)).getDate()
        let total = 0
        
        for (let i = 1; i <= lastDay; i++) {
          const date = new Date(Date.UTC(prevYear, prevMonth, i)).toISOString().slice(0, 10)
          total += parseFloat(getTotalHoursForDate(date))
        }
        
        return total.toFixed(1)
      })()

      // Get total hours up to selected date for current and previous month
      const currentMonthToDate = (() => {
        const date = currentDate
        const month = date.getMonth()
        const year = date.getFullYear()
        const selectedDay = currentDate.getDate()
        let total = 0
        
        for (let i = 1; i <= selectedDay; i++) {
          const currentDate = new Date(Date.UTC(year, month, i)).toISOString().slice(0, 10)
          total += parseFloat(getTotalHoursForDate(currentDate))
        }
        
        return total.toFixed(1)
      })()

      const previousMonthToDate = (() => {
        const prevMonth = previousMonth.getMonth()
        const prevYear = previousMonth.getFullYear()
        const selectedDay = currentDate.getDate()
        let total = 0
        
        for (let i = 1; i <= selectedDay; i++) {
          const date = new Date(Date.UTC(prevYear, prevMonth, i)).toISOString().slice(0, 10)
          total += parseFloat(getTotalHoursForDate(date))
        }
        
        return total.toFixed(1)
      })()

      setMonthComparison({
        currentMonth: currentMonthTotal,
        previousMonth: previousMonthTotal,
        currentMonthToDate,
        previousMonthToDate,
        currentMonthToToday: (() => {
          const todayDate = today.toISOString().slice(0, 10)
          let total = 0
          for (let i = 1; i <= today.getDate(); i++) {
            const date = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), i)).toISOString().slice(0, 10)
            total += parseFloat(getTotalHoursForDate(date))
          }
          return total.toFixed(1)
        })(),
        previousMonthToToday: (() => {
          const prevMonth = previousMonth.getMonth()
          const prevYear = previousMonth.getFullYear()
          let total = 0
          for (let i = 1; i <= today.getDate(); i++) {
            const date = new Date(Date.UTC(prevYear, prevMonth, i)).toISOString().slice(0, 10)
            total += parseFloat(getTotalHoursForDate(date))
          }
          return total.toFixed(1)
        })(),
        selectedDate,
        timestamp: Date.now()
      })

      touchStartRef.current = null
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  return {
    monthComparison,
    setMonthComparison,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}