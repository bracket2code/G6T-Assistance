import { useState, useRef, useEffect } from 'react'
import { type Shift } from '../types/attendance'
import { supabase, retryRequest } from '../lib/supabase'
import { getShifts, saveShifts, addPendingChange, getPendingChanges, removePendingChange } from '../lib/storage'

export function useRecords(userId: string, selectedDate: string) {
  const [records, setRecords] = useState<Record<string, Record<string, Shift[]>>>(() => getShifts())
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load shifts from database
  useEffect(() => {
    const loadShifts = async () => {
      let attempts = 0
      const maxAttempts = 3

      try {
        const currentDate = new Date(selectedDate)
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        while (attempts < maxAttempts) {
          try {
            const { data, error } = await retryRequest(() =>
              supabase
                .from('shifts')
                .select('*')
                .eq('user_id', userId)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])
            )

            if (error) throw error

            // Group shifts by date and business
            const groupedShifts = (data || []).reduce((acc, shift) => {
              const date = shift.date
              if (!acc[date]) acc[date] = {}
              if (!acc[date][shift.business_id]) acc[date][shift.business_id] = []
              
              acc[date][shift.business_id].push({
                id: shift.id,
                checkInTime: shift.check_in || '',
                checkOutTime: shift.check_out || '',
                note: shift.notes || '',
                date: shift.date
              })
              
              return acc
            }, {} as Record<string, Record<string, Shift[]>>)

            setRecords(prev => ({
              ...prev,
              ...groupedShifts
            }))
            
            return // Success, exit the loop
          } catch (error) {
            attempts++
            if (attempts === maxAttempts) throw error
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          }
        }
      } catch (error) {
        console.error('Error loading shifts:', error)
        // Return empty state on error to prevent UI from breaking
        setRecords({})
      }
    }

    loadShifts()
  }, [userId, selectedDate])

  // Sync with database
  useEffect(() => {
    const syncWithDatabase = async () => {
      const pendingChanges = getPendingChanges()
      
      for (const change of pendingChanges) {
        if (change.type !== 'shift') continue

        try {
          switch (change.action) {
            case 'create':
            case 'update':
              await supabase
                .from('shifts')
                .upsert({
                  id: change.data.id,
                  user_id: userId,
                  business_id: change.data.businessId,
                  date: change.data.date,
                  check_in: change.data.checkInTime || null,
                  check_out: change.data.checkOutTime || null,
                  notes: change.data.note
                })
              break
            
            case 'delete':
              await supabase
                .from('shifts')
                .delete()
                .eq('id', change.data.id)
              break
          }

          removePendingChange(change.id)
        } catch (error) {
          console.error('Error syncing change:', error)
        }
      }
    }

    // Save to localStorage
    saveShifts(records)

    // Sync with database after a delay
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(syncWithDatabase, 5000)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [records, userId])

  const handleAddShift = (businessId: string, date: string) => {
    const newShift = {
      id: crypto.randomUUID(),
      checkInTime: '',
      checkOutTime: '',
      note: '',
      date
    }

    setRecords(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [businessId]: [
          ...(prev[date]?.[businessId] || []),
          newShift
        ]
      }
    }))

    addPendingChange({
      id: newShift.id,
      type: 'shift',
      action: 'create',
      data: {
        ...newShift,
        businessId
      }
    })
  }

  const updateShift = (businessId: string, shiftId: string, field: string, value: string, date: string) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [businessId]: prev[date][businessId].map(shift =>
          shift.id === shiftId ? { ...shift, [field]: value } : shift
        )
      }
    }))

    const shift = records[date]?.[businessId]?.find(s => s.id === shiftId)
    if (shift) {
      addPendingChange({
        id: shiftId,
        type: 'shift',
        action: 'update',
        data: {
          ...shift,
          [field]: value,
          businessId
        }
      })
    }
  }

  const deleteShift = (businessId: string, shiftId: string, date: string) => {
    setRecords(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [businessId]: prev[date][businessId].filter(shift => shift.id !== shiftId)
      }
    }))

    addPendingChange({
      id: shiftId,
      type: 'shift',
      action: 'delete',
      data: { id: shiftId }
    })
  }

  return {
    records,
    handleAddShift,
    updateShift,
    deleteShift
  }
}