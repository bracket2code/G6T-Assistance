import { ArrowLeft } from 'lucide-react'
import { type User, type IdType } from '../../../types/auth'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { signUp } from '../../../lib/api/auth'

interface NewUserFormProps {
  onBack: () => void
  onSave: (user: Omit<User, 'id'>) => void
}

export default function NewUserForm({ onBack, onSave }: NewUserFormProps) {
  const [businesses, setBusinesses] = useState<Array<{id: string, name: string}>>([])
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('user')

  const handleSelectAll = () => {
    setSelectedBusinesses(businesses.map(b => b.id))
  }

  const handleDeselectAll = () => {
    setSelectedBusinesses([])
  }

  useEffect(() => {
    const loadBusinesses = async () => {
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('active', true)
        .order('name')
      
      setBusinesses(businessesData || [])
    }
    
    loadBusinesses()
  }, [])

  const [roles] = useState<Array<{name: string}>>([
    { name: 'admin' },
    { name: 'manager' },
    { name: 'user' }
  ])
  
  const [idTypes] = useState<Array<IdType>>([
    'DNI',
    'NIE',
    'Pasaporte',
    'Otros'
  ])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // Validate required fields
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string

    if (!email || !name || !role) {
      console.error('Email, nombre y permiso son obligatorios')
      return
    }

    const password = formData.get('password') as string
    
    if (!password) {
      console.error('La contraseña es obligatoria')
      return
    }

    const userData = {
      email,
      password,
      name,
      lastName: formData.get('lastName') as string,
      idType: formData.get('idType') as IdType,
      idNumber: formData.get('idNumber') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      birthDate: formData.get('birthDate') as string,
      role,
      businesses: selectedRole !== 'admin' ? selectedBusinesses.map(id => ({
        id,
        name: businesses.find(b => b.id === id)?.name || ''
      })) : []
    }
    
    try {
      await signUp(userData)
      onSave(userData)
      onBack() // Return to the previous screen after successful signup
    } catch (error) {
      console.error('Error signing up:', error)
      // Could add error state and display to user here
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold dark:text-white">Nuevo Usuario</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Alias</label>
          <input
            type="text"
            name="alias"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Apellidos</label>
          <input
            type="text"
            name="lastName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Identificación</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              name="idType"
              defaultValue="DNI"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {idTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <input
              type="text"
              name="idNumber"
              placeholder="Número de identificación"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
          <input
            type="tel"
            name="phone"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
          <input
            type="text"
            name="address"
            autoComplete="street-address"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento</label>
          <input
            type="date"
            name="birthDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Permiso</label>
          <select
            name="role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {roles.map(role => (
              <option key={role.name} value={role.name}>
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {selectedRole !== 'admin' && (
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              Empresas Asignadas
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Seleccionar todas
                </button>
                <span className="text-gray-400">|</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Deseleccionar todas
                </button>
              </div>
            </label>
            <div className="mt-2 space-y-2">
              {businesses.map(business => (
                <label key={business.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedBusinesses.includes(business.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBusinesses(prev => [...prev, business.id])
                      } else {
                        setSelectedBusinesses(prev => prev.filter(id => id !== business.id))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{business.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}