import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { User } from '../../types/auth'
import ProfileForm from './ProfileForm'
import ProfileHeader from './ProfileHeader'

interface ProfileProps {
  user: User | null
  onBack: () => void
}

export default function Profile({ user, onBack }: ProfileProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userData, setUserData] = useState<User | null>(null)

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return

      try {
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
            birth_date
          `)
          .eq('id', user.id)
          .single()

        if (error) throw error

        setUserData({
          ...data,
          lastName: data.last_name,
          alias: data.alias,
          role: user.role
        })
      } catch (err) {
        console.error('Error loading user data:', err)
        setError('Error al cargar los datos del usuario')
      }
    }

    loadUserData()
  }, [user?.id])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const password = formData.get('password') as string

      // Update password if provided
      if (password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: password
        })
        if (passwordError) throw passwordError
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from('users')
        .update({
          alias: formData.get('alias'),
          name: formData.get('name'),
          last_name: formData.get('lastName'),
          id_number: formData.get('idNumber'),
          phone: formData.get('phone'),
          address: formData.get('address'),
          birth_date: formData.get('birthDate')
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
      <ProfileHeader onBack={onBack} />

      <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-gray-800">
        <ProfileForm
          user={userData}
          loading={loading}
          error={error}
          success={success}
          onSubmit={handleSubmit}
          onBack={onBack}
        />
      </div>
    </div>
  )
}