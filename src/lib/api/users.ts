import { supabase } from '../supabase'
import type { User } from '../../types/auth'

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      alias,
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
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password || '',
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          name: userData.name,
          lastName: userData.lastName || '',
          idType: userData.idType || 'DNI',
          idNumber: userData.idNumber || '',
          phone: userData.phone || '',
          address: userData.address || '',
          birthDate: userData.birthDate || null,
          role: userData.role,
          role_id: roleData.id
        }
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

    // Add business assignments if provided and not admin
    if (userData.businesses && userData.businesses.length > 0 && userData.role !== 'admin') {
      const { error: businessError } = await supabase
        .from('user_businesses')
        .insert(
          userData.businesses.map(business => ({
            user_id: userProfile.id,
            business_id: business.id
          }))
        )
      
      if (businessError) throw businessError
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
      alias: userData.alias,
      id_type: userData.idType || 'DNI',
      id_number: userData.idNumber || null,
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
    alias: data.alias,
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
  // Delete user from public.users first
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (userError) throw userError

  // Then delete auth user if we have admin access
  try {
    await supabase.auth.admin.deleteUser(id)
  } catch (error) {
    // If we can't delete the auth user (e.g. not admin), just disable the account
    await supabase.auth.updateUser({
      data: { disabled: true }
    })
  }
}