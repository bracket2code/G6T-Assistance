import { supabase } from '../supabase'

export const saveShift = async (
  userId: string,
  businessId: string,
  date: string,
  checkIn: string,
  checkOut: string,
  notes: string
) => {
  // First try to find an existing shift
  const { data: existingShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .eq('date', date)
    .maybeSingle()

  let data, error

  if (existingShift) {
    // Update existing shift
    const result = await supabase
      .from('shifts')
      .update({
        check_in: checkIn,
        check_out: checkOut,
        notes: notes || ''
      })
      .eq('id', existingShift.id)
      .select()
      .single()
    
    data = result.data
    error = result.error
  } else {
    // Create new shift
    const result = await supabase
      .from('shifts')
      .insert({
        user_id: userId,
        business_id: businessId,
        date,
        check_in: checkIn,
        check_out: checkOut,
        notes: notes || ''
      })
      .select()
      .single()
    
    data = result.data
    error = result.error
  }

  if (error) throw error
  return data
}

export const updateShift = async (
  shiftId: string,
  checkIn: string,
  checkOut: string,
  notes: string
) => {
  const { data, error } = await supabase
    .from('shifts')
    .update({
      check_in: checkIn,
      check_out: checkOut,
      notes
    })
    .eq('id', shiftId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteShift = async (shiftId: string) => {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId)

  if (error) throw error
}

export const getMonthShifts = async (userId: string, year: number, month: number) => {
  const startDate = new Date(year, month, 1).toISOString().slice(0, 10)
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('shifts')
    .select(`
      id,
      business_id,
      check_in,
      check_out,
      notes,
      date
    `)
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) throw error
  return data
}