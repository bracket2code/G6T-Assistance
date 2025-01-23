import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search } from 'lucide-react'
import { calculateHours } from '../../lib/utils/dateUtils'

type SearchResult = {
  type: 'shift' | 'note'
  date: string
  text: string
  businessName?: string
  hours?: number
}

export default function NotesSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTypes, setSearchTypes] = useState({
    shifts: true,
    notes: true
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setLoading(true)

    try {
      const results: SearchResult[] = []

      // Buscar en notas de turnos
      if (searchTypes.shifts) {
        const { data: shifts } = await supabase
          .from('shifts')
          .select(`
            id,
            date,
            notes,
            check_in,
            check_out,
            businesses (name)
          `)
          .ilike('notes', `%${searchTerm}%`)
          .order('date', { ascending: false })

        shifts?.forEach(shift => {
          if (shift.notes) {
            results.push({
              type: 'shift',
              date: shift.date,
              text: shift.notes,
              businessName: shift.businesses?.name,
              hours: shift.check_in && shift.check_out ? 
                calculateHours(shift.check_in, shift.check_out) : undefined
            })
          }
        })
      }

      // Buscar en notas del día
      if (searchTypes.notes) {
        const { data: notes } = await supabase
          .from('daily_notes')
          .select('*')
          .ilike('text', `%${searchTerm}%`)
          .order('date', { ascending: false })

        notes?.forEach(note => {
          results.push({
            type: 'note',
            date: note.date,
            text: note.text
          })
        })
      }

      setResults(results)
    } catch (error) {
      console.error('Error searching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Filtros de tipo */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={searchTypes.shifts}
              onChange={(e) => setSearchTypes(prev => ({ ...prev, shifts: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Notas de turnos</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={searchTypes.notes}
              onChange={(e) => setSearchTypes(prev => ({ ...prev, notes: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Notas del día</span>
          </label>
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Buscando...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 border rounded-lg dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {new Date(result.date).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    result.type === 'shift'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  }`}>
                    {result.type === 'shift' ? 'Turno' : 'Nota del día'}
                  </span>
                </div>
                {result.type === 'shift' && result.hours !== undefined && (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {result.hours.toFixed(1)}h
                  </span>
                )}
              </div>
              {result.businessName && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {result.businessName}
                </div>
              )}
              <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                {result.text}
              </p>
            </div>
          ))}
        </div>
      ) : searchTerm && !loading && (
        <p className="text-center text-gray-600 dark:text-gray-400 py-4">
          No se encontraron resultados
        </p>
      )}
    </div>
  )
}