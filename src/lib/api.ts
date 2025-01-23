import { supabase } from './supabase'
import type { User } from '../types/auth'
import type { Priority } from '../types/attendance'

// Auth API
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      roles:role_id (name)
    `)
    .eq('id', data.user.id)
    .maybeSingle()

  if (userError) throw userError

  return {
    user: {
      id: userData.id,
      email: userData.email,
      role: userData.roles?.name || 'user'
    },
    token: data.session?.access_token
  }
}

// Shifts API
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

// Notes API
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

// User API
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      last_name,
      id_type,
      id_number,
      phone,
      address,
      birth_date,
      roles:role_id (name),
      businesses:user_businesses(
        business:business_id(
          id,
          name
        )
      )
    `)
    .order('name')

  if (error) throw error

  return data.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    lastName: user.last_name,
    idType: user.id_type || 'DNI',
    idNumber: user.id_number,
    phone: user.phone,
    address: user.address,
    birthDate: user.birth_date,
    role: user.roles?.name || 'user',
    businesses: user.businesses?.map(b => b.business) || []
  }))
}

export const createUser = async (userData: Omit<User, 'id'>) => {
  try {
  // Get role ID first
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', userData.role)
    .single()

  if (!roleData) {
    throw new Error('Rol no encontrado')
  }

    // Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password || '',
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        lastName: userData.lastName,
        idType: userData.idType,
        idNumber: userData.idNumber,
        phone: userData.phone,
        address: userData.address,
        birthDate: userData.birthDate,
        role: userData.role,
        role_id: roleData.id
      }
    })

  if (authError) throw authError
  
  // Wait for the trigger to create the user profile with retries
  let attempts = 5;
  let userProfile = null;
  
  while (attempts > 0 && !userProfile) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        last_name,
        id_type,
        id_number,
        phone,
        address,
        birth_date,
        roles:role_id (name)
      `)
      .eq('id', authData.user!.id)
      .maybeSingle()

    if (data && !error) {
      userProfile = data
      break
    }

    attempts--
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  if (!userProfile) {
    throw new Error('Error al crear el perfil de usuario')
  }

  // Update user profile with provided data
  await supabase
    .from('users')
    .update({ 
      name: userData.name,
      last_name: userData.lastName,
      id_type: userData.idType,
      id_number: userData.idNumber,
      phone: userData.phone || null,
      address: userData.address || null,
      birth_date: userData.birthDate ? new Date(userData.birthDate).toISOString() : null,
      role_id: roleData.id
    })
    .eq('id', userProfile.id)

  // Add business assignments if provided and not admin
  if (userData.businesses && userData.businesses.length > 0 && userData.role !== 'admin') {
    await supabase
      .from('user_businesses')
      .insert(
        userData.businesses.map(business => ({
          user_id: userProfile.id,
          business_id: business.id
        }))
      )
  }

  return {
    user: {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name || '',
      lastName: userProfile.last_name || '',
      idType: userProfile.id_type || 'DNI',
      idNumber: userProfile.id_number || `USER-${authData.user!.id}`,
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      birthDate: userProfile.birth_date || null,
      role: userProfile.roles?.name || 'user',
      businesses: userData.businesses || []
    }
  }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export const updateUserBusinesses = async (userId: string, businessIds: string[]) => {
  // First delete existing assignments
  const { error: deleteError } = await supabase
    .from('user_businesses')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  // Then insert new assignments if any
  if (businessIds.length > 0) {
    const { error: insertError } = await supabase
      .from('user_businesses')
      .insert(
        businessIds.map(businessId => ({
          user_id: userId,
          business_id: businessId
        }))
      )

    if (insertError) throw insertError
  }
}

export const updateUser = async (id: string, userData: Partial<User>) => {
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('name', userData.role)
    .single()

  // Update business assignments if provided and not admin
  if (userData.businesses && userData.role !== 'admin') {
    await updateUserBusinesses(id, userData.businesses.map(b => b.id))
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      name: userData.name,
      last_name: userData.lastName,
      id_type: userData.idType,
      id_number: userData.idNumber,
      phone: userData.phone,
      address: userData.address,
      birth_date: userData.birthDate,
      role_id: roleData?.id
    })
    .eq('id', id)
    .select(`
      id,
      email,
      name,
      last_name,
      id_type,
      id_number,
      phone,
      address,
      birth_date,
      roles:role_id (name),
      businesses:user_businesses(
        business:business_id(
          id,
          name
        )
      )
    `)
    .single()

  if (error) throw error

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    lastName: data.last_name,
    idType: data.id_type,
    idNumber: data.id_number,
    phone: data.phone,
    address: data.address,
    birthDate: data.birth_date,
    role: data.roles?.name || 'user',
    businesses: data.businesses?.map(b => b.business) || []
  }
}

export const deleteUser = async (id: string) => {
  // First delete from auth.users which will cascade to public.users
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError) throw authError

  // Also delete from our users table just in case
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Business API
export const getBusinesses = async () => {
  const { data, error } = await supabase
    .from('businesses') 
    .select('*')
    .eq('active', true)
    .order('name')

  if (error) throw error
  return data.map(business => ({
    id: business.id,
    name: business.name,
    legal_name: business.legal_name,
    address: business.address,
    email: business.email,
    tax_id: business.tax_id,
    notes: business.notes,
    active: business.active,
    created_at: business.created_at
  }))
}

export const createBusiness = async (businessData: any) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert(businessData)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateBusiness = async (id: string, businessData: any) => {
  const { data, error } = await supabase
    .from('businesses')
    .update(businessData)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const deleteBusiness = async (id: string) => {
  const { error } = await supabase
    .from('businesses')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}