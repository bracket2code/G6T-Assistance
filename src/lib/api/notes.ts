import { supabase } from '../supabase'
import { type Priority } from '../../types/attendance'

export const saveNote = async (
  userId: string,
  date: string,
  text: string,
  priority: Priority
) => {
  const { data, error } = await supabase
    .from('daily_notes')
    .insert({
      user_id: userId,
      date,
      text,
      priority
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateNote = async (
  noteId: string,
  text: string,
  priority: Priority
) => {
  const { data, error } = await supabase
    .from('daily_notes')
    .update({
      text,
      priority
    })
    .eq('id', noteId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteNote = async (noteId: string) => {
  const { error } = await supabase
    .from('daily_notes')
    .delete()
    .eq('id', noteId)

  if (error) throw error
}

export const getMonthNotes = async (userId: string, year: number, month: number) => {
  const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_notes')
    .select(`
      id,
      text,
      priority,
      date,
      created_at
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) throw error
  return data
}