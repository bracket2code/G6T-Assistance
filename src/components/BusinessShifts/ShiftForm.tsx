import { Trash2 } from 'lucide-react'
import { type Shift } from '../../types/attendance'

interface ShiftFormProps {
  shift: Shift
  onUpdate: (field: string, value: string) => void
  onDelete: () => void
}

export default function ShiftForm({ shift, onUpdate, onDelete }: ShiftFormProps) {
  return (
    <div className="border-b pb-4 dark:border-gray-700 last:border-b-0">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-2 mb-4">
        <div onClick={e => e.stopPropagation()}>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Entrada</label>
          <input
            type="time"
            value={shift.checkInTime}
            onChange={(e) => onUpdate('checkInTime', e.target.value)}
            className="w-full p-2 border rounded text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div onClick={e => e.stopPropagation()}>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Salida</label>
          <input
            type="time"
            value={shift.checkOutTime}
            onChange={(e) => onUpdate('checkOutTime', e.target.value)}
            className="w-full p-2 border rounded text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div onClick={e => e.stopPropagation()} className="flex items-end justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="flex items-center justify-center h-[40px] w-[40px] text-red-500 hover:text-red-600 cursor-pointer dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()}>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Notas</label>
        <textarea
          value={shift.note}
          onChange={(e) => onUpdate('note', e.target.value)}
          placeholder="Notas del turno"
          className="w-full p-2 border rounded h-20 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
    </div>
  )
}