import { Plus, Trash2, Info } from 'lucide-react'
import { type Priority } from '../../types/attendance'
import { useState } from 'react'

interface Note {
  id: string
  text: string
  priority: Priority
  created_at: string
}

interface DailyNotesProps {
  selectedDate: string
  dailyNotes: Record<string, Note[]>
  notesExpanded: boolean
  onToggleExpand: () => void
  onAddNote: () => void
  onUpdateNote: (noteId: string, text: string) => void
  onDeleteNote: (noteId: string) => void
  onUpdateNotePriority: (noteId: string, priority: Priority) => void
}

export default function DailyNotes({
  selectedDate,
  dailyNotes,
  notesExpanded,
  onToggleExpand,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onUpdateNotePriority
}: DailyNotesProps) {
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null)

  const getHighestPriority = (date: string): Priority => {
    const notes = dailyNotes[date] || []
    if (notes.some(note => note.priority === 'high' && note.text.trim() !== '')) return 'high'
    if (notes.some(note => note.priority === 'medium' && note.text.trim() !== '')) return 'medium'
    if (notes.some(note => note.priority === 'low' && note.text.trim() !== '')) return 'low'
    if (notes.some(note => note.priority === 'vacation' && note.text.trim() !== '')) return 'vacation'
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

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      onDeleteNote(noteId)
    }
  }

  return (
    <div className="border rounded-lg mb-6 dark:border-gray-700 min-h-[56px] overflow-hidden">
      <div 
        className="flex items-center justify-between cursor-pointer h-14 px-4 bg-white dark:bg-gray-800"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold dark:text-white">Notas del día</h3>
          {getHighestPriority(selectedDate) && (
            <div className={`w-2 h-2 ${
              getPriorityColor(getHighestPriority(selectedDate))
            } rounded-full`} />
          )}
        </div>
        <div className="flex items-center gap-2">
          {!notesExpanded && dailyNotes[selectedDate]?.some(note => note.text.trim() !== '') && (
            <div className="text-sm text-gray-600 whitespace-nowrap dark:text-gray-400">
              {dailyNotes[selectedDate].filter(note => note.text.trim() !== '').length} nota(s)
            </div>
          )}
          {notesExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddNote()
              }}
              className="inline-flex items-center gap-1 whitespace-nowrap bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              Añadir Nota
            </button>
          )}
        </div>
      </div>
      {notesExpanded && (
        <div className="space-y-4 p-4 border-t dark:border-gray-700">
          {dailyNotes[selectedDate]?.map((note) => (
            <div key={note.id} className="flex gap-4 items-start border-b dark:border-gray-700 pb-4 last:border-b-0">
              <div className="flex-1 space-y-2">
                <textarea
                  value={note.text}
                  onChange={(e) => onUpdateNote(note.id, e.target.value)}
                  placeholder="Escribe tu nota aquí..."
                  className="w-full p-3 border rounded-lg h-20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <div className="flex items-center">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateNotePriority(note.id, 'low')
                        setSelectedPriority('low')
                      }}
                      className={`p-2 rounded ${
                        note.priority === 'low' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 hover:bg-blue-200'
                      }`}
                      onMouseEnter={() => setSelectedPriority('low')}
                      onMouseLeave={() => setSelectedPriority(null)}
                    >
                      <div className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateNotePriority(note.id, 'vacation')
                        setSelectedPriority('vacation')
                      }}
                      className={`p-2 rounded ${
                        note.priority === 'vacation'
                          ? 'bg-purple-500 text-white'
                          : 'bg-purple-100 hover:bg-purple-200'
                      }`}
                      onMouseEnter={() => setSelectedPriority('vacation')}
                      onMouseLeave={() => setSelectedPriority(null)}
                    >
                      <div className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateNotePriority(note.id, 'medium')
                        setSelectedPriority('medium')
                      }}
                      className={`p-2 rounded ${
                        note.priority === 'medium'
                          ? 'bg-yellow-200 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-100'
                      }`}
                      onMouseEnter={() => setSelectedPriority('medium')}
                      onMouseLeave={() => setSelectedPriority(null)}
                    >
                      <div className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateNotePriority(note.id, 'high')
                        setSelectedPriority('high')
                      }}
                      className={`p-2 rounded ${
                        note.priority === 'high'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 hover:bg-red-200'
                      }`}
                      onMouseEnter={() => setSelectedPriority('high')}
                      onMouseLeave={() => setSelectedPriority(null)}
                    >
                      <div className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="ml-4 min-w-[120px] text-sm text-gray-600 dark:text-gray-400">
                    {selectedPriority === 'low' || note.priority === 'low' ? 'Información' : ''}
                    {selectedPriority === 'vacation' || note.priority === 'vacation' ? 'Vacaciones' : ''}
                    {selectedPriority === 'medium' || note.priority === 'medium' ? 'Importante' : ''}
                    {selectedPriority === 'high' || note.priority === 'high' ? 'Muy Importante' : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteNote(note.id)
                  setSelectedPriority(null)
                }}
                className="text-red-500 hover:text-red-600 cursor-pointer"
                title="Eliminar nota"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          {(!dailyNotes[selectedDate] || dailyNotes[selectedDate].length === 0) && (
            <p className="text-gray-500 text-center py-4 dark:text-gray-400">
              No hay notas para este día. Haz clic en "Añadir Nota" para crear una.
            </p>
          )}
        </div>
      )}
    </div>
  )
}