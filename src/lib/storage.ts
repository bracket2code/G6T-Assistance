import { type Shift, type Priority } from '../types/attendance'

// Keys for localStorage
const SHIFTS_KEY = 'shifts'
const NOTES_KEY = 'notes'
const PENDING_CHANGES_KEY = 'pendingChanges'

// Types for pending changes
type PendingChange = {
  id: string
  type: 'shift' | 'note'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

// Storage functions
export function getFromStorage<T>(key: string): T {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function setInStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage:`, error)
  }
}

// Shifts
export function getShifts(): Record<string, Record<string, Shift[]>> {
  return getFromStorage(SHIFTS_KEY) || {}
}

export function saveShifts(shifts: Record<string, Record<string, Shift[]>>): void {
  setInStorage(SHIFTS_KEY, shifts)
}

// Notes
export function getNotes(): Record<string, Array<{
  id: number
  text: string
  priority: Priority
  created_at: string
}>> {
  return getFromStorage(NOTES_KEY) || {}
}

export function saveNotes(notes: Record<string, any[]>): void {
  setInStorage(NOTES_KEY, notes)
}

// Pending changes
export function getPendingChanges(): PendingChange[] {
  return getFromStorage(PENDING_CHANGES_KEY) || []
}

export function addPendingChange(change: Omit<PendingChange, 'timestamp'>): void {
  const pendingChanges = getPendingChanges()
  const newChange = { ...change, timestamp: Date.now() }
  
  // Remove any existing changes for the same entity
  const filteredChanges = pendingChanges.filter(c => 
    !(c.type === change.type && c.id === change.id)
  )
  
  setInStorage(PENDING_CHANGES_KEY, [...filteredChanges, newChange])
}

export function removePendingChange(id: string): void {
  const pendingChanges = getPendingChanges()
  const filteredChanges = pendingChanges.filter(change => change.id !== id)
  setInStorage(PENDING_CHANGES_KEY, filteredChanges)
}

// Clear all pending changes
export function clearPendingChanges(): void {
  setInStorage(PENDING_CHANGES_KEY, [])
}

// Sync status
export function getLastSyncTimestamp(): number {
  return getFromStorage('lastSync') || 0
}

export function updateLastSyncTimestamp(): void {
  setInStorage('lastSync', Date.now())
}