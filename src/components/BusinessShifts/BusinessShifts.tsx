import { Plus, Trash2 } from 'lucide-react'
import { type Business, type Shift } from '../../types/attendance'
import SignaturePad from './SignaturePad'
import { useAuth } from '../../hooks/useAuth'

interface BusinessShiftsProps {
  businesses: Business[]
  selectedDate: string
  records: Record<string, Record<string, Shift[]>>
  expandedBusinesses: Record<string, boolean>
  onToggleExpand: (businessId: string) => void
  onAddShift: (businessId: string) => void
  onUpdateShift: (businessId: string, shiftId: number, field: string, value: string) => void
  onDeleteShift: (businessId: string, shiftId: number) => void
}

export default function BusinessShifts({
  businesses,
  selectedDate,
  records,
  expandedBusinesses,
  onToggleExpand,
  onAddShift,
  onUpdateShift,
  onDeleteShift
}: BusinessShiftsProps) {
  const { session } = useAuth()

  const calculateHours = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0
    const [inHours, inMinutes] = checkIn.split(':').map(Number)
    const [outHours, outMinutes] = checkOut.split(':').map(Number)
    return ((outHours * 60 + outMinutes) - (inHours * 60 + inMinutes)) / 60
  }

  const getTotalHours = (shifts: Shift[] = []) => {
    return shifts.reduce((total, shift) => {
      const hours = calculateHours(shift.checkInTime, shift.checkOutTime)
      return total + hours
    }, 0)
  }

  const hasValidShifts = (shifts: Shift[] = []) => {
    return shifts.some(shift => shift.checkInTime && shift.checkOutTime)
  }

  const handleDeleteShift = (businessId: string, shiftId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este turno?')) {
      onDeleteShift(businessId, shiftId)
    }
  }

  return (
    <div className="space-y-4">
      {/* Lista de empresas */}
      {businesses.map(business => {
        const businessShifts = records[selectedDate]?.[business.id] || []
        const showHours = hasValidShifts(businessShifts)
        
        return (
          <div 
            key={business.id} 
            className="border rounded-lg overflow-hidden dark:border-gray-700"
          >
            <div 
              className="flex items-center justify-between px-2 h-[40px] bg-white dark:bg-gray-800 cursor-pointer"
              onClick={() => {
                const hasShifts = records[selectedDate]?.[business.id]?.length > 0
                if (!hasShifts && !expandedBusinesses[business.id]) {
                  onAddShift(business.id)
                }
                onToggleExpand(business.id)
              }}
            >
              <div className="flex items-center flex-1">
                <h3 className="text-xl font-semibold hover:text-blue-500 dark:text-gray-200 dark:hover:text-blue-400">
                  {business.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {showHours && (
                  <div className="text-base text-blue-600 font-medium whitespace-nowrap dark:text-blue-400">
                    {getTotalHours(businessShifts).toFixed(1)}h
                  </div>
                )}
                {expandedBusinesses[business.id] && businessShifts.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddShift(business.id)
                    }}
                    className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir Turno
                  </button>
                )}
              </div>
            </div>

            {expandedBusinesses[business.id] && businessShifts.length > 0 && (
              <div className="border-t dark:border-gray-700">
                <div className="space-y-3 p-2">
                  {businessShifts.map((shift) => (
                    <div key={shift.id} className="border-b pb-4 dark:border-gray-700 last:border-b-0">
                      <div className="grid grid-cols-[1fr_1fr_40px] gap-2 mb-4">
                        <div onClick={e => e.stopPropagation()}>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Entrada</label>
                          <input
                            type="time"
                            value={shift.checkInTime}
                            onChange={(e) => onUpdateShift(business.id, shift.id, 'checkInTime', e.target.value)}
                            className="w-full p-2 border rounded text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Salida</label>
                          <input
                            type="time"
                            value={shift.checkOutTime}
                            onChange={(e) => onUpdateShift(business.id, shift.id, 'checkOutTime', e.target.value)}
                            className="w-full p-2 border rounded text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div onClick={e => e.stopPropagation()} className="flex items-end justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteShift(business.id, shift.id)
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
                            onChange={(e) => onUpdateShift(business.id, shift.id, 'note', e.target.value)}
                            placeholder="Notas del turno"
                            className="w-full p-2 border rounded h-20 text-base dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Firma al final de todas las empresas */}
      {session?.user && businesses.length > 0 && (
        <div className="mt-8">
          <SignaturePad
            userId={session.user.id}
            businessId={businesses[0]?.id}
            date={selectedDate}
            onSignatureComplete={() => {
              // Aquí podrías actualizar el estado o hacer algo cuando se complete la firma
            }}
          />
        </div>
      )}
    </div>
  )
}