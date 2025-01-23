import { supabase } from '../supabase';
import { handleRequest } from '../utils';
import type { User } from '../../types/auth';

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await handleRequest(() => supabase.auth.signInWithPassword({
      email,
      password,
    }))

    if (error) throw error

    return {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: data.user?.user_metadata?.role || 'user'
      }
    }
  } catch (error) {
    console.error('Error signing in:', error)
    const message = error instanceof Error ? error.message : 'Error durante el inicio de sesión'
    throw new Error(message)
  }
}

export const signUp = async (userData: Omit<User, 'id'>) => {
  try {
    const { data: authData, error: authError } = await handleRequest(() => supabase.auth.signUp({
      email: userData.email,
      password: userData.password || '',
      options: {
        data: {
          name: userData.name,
          alias: userData.alias,
          lastName: userData.lastName || '',
          idType: userData.idType || 'DNI',
          idNumber: userData.idNumber || '',
          phone: userData.phone || '',
          address: userData.address || '',
          birthDate: userData.birthDate || null,
          role: userData.role || 'user'
        }
      }
    }))

    if (authError) throw authError

    if (!authData.user) {
      throw new Error('No se pudo crear el usuario')
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        role: userData.role || 'user'
      }
    }
  } catch (error) {
    console.error('Error signing up:', error)
    const message = error instanceof Error ? error.message : 'Error durante el registro'
    throw new Error(message)
  }
}