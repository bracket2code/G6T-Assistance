import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthNavigationProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

export default function MonthNavigation({ selectedDate, onDateChange }: MonthNavigationProps) {
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currentDate = new Date(selectedDate)
    const newDate = new Date(currentDate.getFullYear(), parseInt(e.target.value), currentDate.getDate())
    onDateChange(newDate.toISOString().slice(0, 10))
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currentDate = new Date(selectedDate)
    const newDate = new Date(parseInt(e.target.value), currentDate.getMonth(), currentDate.getDate())
    onDateChange(newDate.toISOString().slice(0, 10))
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const now = new Date()
    const madridNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    madridNow.setHours(12) // Set to noon to avoid DST issues
    const currentDate = new Date(selectedDate)
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }))
    
    if (direction === 'prev') {
      const newDate = new Date(currentDate)
      newDate.setMonth(currentDate.getMonth() - 1)
      newDate.setDate(1)
      
      if (today.getMonth() === newDate.getMonth() && today.getFullYear() === newDate.getFullYear()) {
        newDate.setDate(today.getDate())
      }
      
      onDateChange(newDate.toISOString().slice(0, 10))
    } else {
      const newDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
      
      if (today.getMonth() === newDate.getMonth() && today.getFullYear() === newDate.getFullYear()) {
        newDate.setDate(today.getDate())
      }
      
      onDateChange(newDate.toISOString().slice(0, 10))
    }
  }

  return (
    <div className="flex justify-center items-center gap-2 w-full">
      <button
        onClick={() => navigateMonth('prev')}
        className="border rounded h-[42px] w-[42px] flex items-center justify-center hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Mes anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex gap-2">
        <select
          value={new Date(selectedDate).getMonth()}
          onChange={handleMonthChange}
          className="border rounded h-[42px] px-3 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 appearance-none w-36"
        >
          {[
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ].map((month, index) => (
            <option key={month} value={index}>{month}</option>
          ))}
        </select>
        <select
          value={new Date(selectedDate).getFullYear()}
          onChange={handleYearChange}
          className="border rounded h-[42px] px-3 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 appearance-none w-20"
        >
          {Array.from({ length: 5 }, (_, i) => 2025 + i - 2).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => navigateMonth('next')}
        className="border rounded h-[42px] w-[42px] flex items-center justify-center hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Mes siguiente"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}