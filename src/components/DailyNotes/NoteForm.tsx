import { Trash2 } from 'lucide-react'
import { type Priority } from '../../types/attendance'
import { useState } from 'react'

interface NoteFormProps {
  id: string
  text: string
  priority: Priority
  onUpdateText: (text: string) => void
  onUpdatePriority: (priority: Priority) => void
  onDelete: () => void
}

export default function NoteForm({
  id,
  text,
  priority,
  onUpdateText,
  onUpdatePriority,
  onDelete
}: NoteFormProps) {
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null)

  return (
    <div className="flex gap-4 items-start border-b dark:border-gray-700 pb-4 last:border-b-0">
      <div className="flex-1 space-y-2">
        <textarea
          value={text}
          onChange={(e) => onUpdateText(e.target.value)}
          placeholder="Escribe tu nota aquí..."
          className="w-full p-3 border rounded-lg h-20 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div className="flex items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onUpdatePriority('low')
                setSelectedPriority('low')
              }}
              className={`p-2 rounded ${
                priority === 'low' 
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
                onUpdatePriority('vacation')
                setSelectedPriority('vacation')
              }}
              className={`p-2 rounded ${
                priority === 'vacation'
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
                onUpdatePriority('medium')
                setSelectedPriority('medium')
              }}
              className={`p-2 rounded ${
                priority === 'medium'
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
                onUpdatePriority('high')
                setSelectedPriority('high')
              }}
              className={`p-2 rounded ${
                priority === 'high'
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
            {selectedPriority === 'low' || priority === 'low' ? 'Información' : ''}
            {selectedPriority === 'vacation' || priority === 'vacation' ? 'Vacaciones' : ''}
            {selectedPriority === 'medium' || priority === 'medium' ? 'Importante' : ''}
            {selectedPriority === 'high' || priority === 'high' ? 'Muy Importante' : ''}
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
          setSelectedPriority(null)
        }}
        className="text-red-500 hover:text-red-600 cursor-pointer"
        title="Eliminar nota"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}