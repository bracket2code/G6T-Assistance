import { useState, useRef, useEffect } from 'react'
import { type Priority } from '../types/attendance'
import { supabase } from '../lib/supabase'
import { getNotes, saveNotes, addPendingChange, getPendingChanges, removePendingChange } from '../lib/storage'

export function useDailyNotes(userId: string, selectedDate: string) {
  const [dailyNotes, setDailyNotes] = useState<Record<string, Array<{
    id: string
    text: string
    priority: Priority
    created_at: string
  }>>>(getNotes)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load notes from database
  useEffect(() => {
    const loadNotes = async () => {
      try {
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
          try {
        const currentDate = new Date(selectedDate)
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        const { data, error } = await supabase
          .from('daily_notes')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])

            if (error) throw error

            // Group notes by date
            const groupedNotes = (data || []).reduce((acc, note) => {
              const date = note.date
              if (!acc[date]) acc[date] = []
          
              acc[date].push({
                id: note.id,
                text: note.text,
                priority: note.priority,
                created_at: note.created_at
              })
          
              return acc
            }, {} as Record<string, Array<{
              id: string
              text: string
              priority: Priority
              created_at: string
            }>>)

            setDailyNotes(prev => ({
              ...prev,
              ...groupedNotes
            }))
            
            // If successful, exit the retry loop
            return;
          } catch (err) {
            lastError = err;
            retries--;
            if (retries > 0) {
              // Wait before retrying with exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
            }
          }
        }
        
        // If we get here, all retries failed
        throw lastError;
      } catch (error) {
        console.error('Error loading notes:', error)
        // Return empty state on error to prevent UI from breaking
        setDailyNotes({})
      }
    }

    loadNotes()
  }, [userId, selectedDate])

  // Sync with database
  useEffect(() => {
    const syncWithDatabase = async () => {
      const pendingChanges = getPendingChanges()
      
      for (const change of pendingChanges) {
        if (change.type !== 'note') continue

        try {
          switch (change.action) {
            case 'create':
            case 'update':
              await supabase
                .from('daily_notes')
                .upsert({
                  id: change.data.id,
                  user_id: userId,
                  date: change.data.date,
                  text: change.data.text,
                  priority: change.data.priority
                })
              break
            
            case 'delete':
              await supabase
                .from('daily_notes')
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
    saveNotes(dailyNotes)

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
  }, [dailyNotes, userId])

  const handleAddNote = (date: string) => {
    const newNote = {
      id: crypto.randomUUID(),
      text: '',
      priority: 'low' as Priority,
      created_at: new Date().toISOString()
    }

    setDailyNotes(prev => ({
      ...prev,
      [date]: [
        ...(prev[date] || []),
        newNote
      ]
    }))

    addPendingChange({
      id: newNote.id,
      type: 'note',
      action: 'create',
      data: {
        ...newNote,
        date
      }
    })
  }

  const updateNote = (noteId: string, text: string, date: string) => {
    setDailyNotes(prev => ({
      ...prev,
      [date]: prev[date].map(note =>
        note.id === noteId ? { ...note, text } : note
      )
    }))

    const note = dailyNotes[date]?.find(n => n.id === noteId)
    if (note) {
      addPendingChange({
        id: note.id,
        type: 'note',
        action: 'update',
        data: {
          ...note,
          text,
          date
        }
      })
    }
  }

  const deleteNote = (noteId: string, date: string) => {
    setDailyNotes(prev => ({
      ...prev,
      [date]: prev[date].filter(note => note.id !== noteId)
    }))

    const note = dailyNotes[date]?.find(n => n.id === noteId)
    if (note) {
      addPendingChange({
        id: note.id,
        type: 'note',
        action: 'delete',
        data: { id: noteId }
      })
    }
  }

  const updateNotePriority = (noteId: string, priority: Priority, date: string) => {
    setDailyNotes(prev => ({
      ...prev,
      [date]: prev[date].map(note =>
        note.id === noteId ? { ...note, priority } : note
      )
    }))

    const note = dailyNotes[date]?.find(n => n.id === noteId)
    if (note) {
      addPendingChange({
        id: note.id,
        type: 'note',
        action: 'update',
        data: {
          ...note,
          priority,
          date
        }
      })
    }
  }

  return {
    dailyNotes,
    handleAddNote,
    updateNote,
    deleteNote,
    updateNotePriority
  }
}