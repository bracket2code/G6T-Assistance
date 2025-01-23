import { useState, useEffect } from 'react'
import { Building2, ArrowLeft, Users, FileText } from 'lucide-react'
import { type User } from '../types/auth'
import { getUsers, getBusinesses, createUser, updateUser, deleteUser, createBusiness, updateBusiness, deleteBusiness } from '../lib/api'
import UsersPanel from './admin/UsersPanel'
import BusinessesPanel from './admin/BusinessesPanel'
import ReportDesignPanel from './admin/ReportDesignPanel'

type Business = {
  id: string
  commercial_name: string
  legal_name: string
  address: string
  email: string
  tax_id: string
  notes: string
  active: boolean
  created_at: string
}

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'businesses' | 'reports'>('users')
  const [showNewBusiness, setShowNewBusiness] = useState(false)
  const [businessSearchTerm, setBusinessSearchTerm] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [showNewUser, setShowNewUser] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      try {
        const usersData = await getUsers()
        setUsers(usersData)
      } catch (error) {
        console.error('Error loading users:', error)
      }
      setLoading(false)
    }
    
    loadUsers()
  }, [])

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const businessesData = await getBusinesses()
        setBusinesses(businessesData)
      } catch (error) {
        console.error('Error loading businesses:', error)
      }
    }
    
    loadBusinesses()
  }, [])

  const handleAddUser = async (newUser: Omit<User, 'id'>) => {
    try {
      const { user } = await createUser(newUser)
      setUsers(prev => [...prev, user])
      setShowNewUser(false)
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const user = await updateUser(updatedUser.id, updatedUser)
      setUsers(prev => prev.map(u => u.id === user.id ? user : u))
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setUsers(prev => prev.filter(user => user.id !== userId))
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleAddBusiness = async (newBusiness: any) => {
    try {
      const business = await createBusiness(newBusiness)
      setBusinesses(prev => [...prev, business])
      setShowNewBusiness(false)
    } catch (error) {
      console.error('Error creating business:', error)
    }
  }

  const handleUpdateBusiness = async (updatedBusiness: any) => {
    try {
      const business = await updateBusiness(updatedBusiness.id, updatedBusiness)
      setBusinesses(prev => prev.map(b => b.id === business.id ? business : b))
      setSelectedBusiness(null)
    } catch (error) {
      console.error('Error updating business:', error)
    }
  }

  const handleDeleteBusiness = async (id: string) => {
    try {
      await deleteBusiness(id)
      setBusinesses(prev => prev.filter(business => business.id !== id))
    } catch (error) {
      console.error('Error deleting business:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 dark:bg-gray-900 dark:text-white">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold dark:text-white">Panel de Administración</h1>
      </div>

      <div className="flex flex-col gap-8">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Usuarios</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'businesses'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span>Empresas</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>Diseño de Informes</span>
            </div>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-gray-800">
          {activeTab === 'users' ? (
            <UsersPanel
              users={users}
              loading={loading}
              searchTerm={searchTerm}
              selectedUser={selectedUser}
              showNewUser={showNewUser}
              onSearchChange={setSearchTerm}
              onSelectUser={setSelectedUser}
              onShowNewUser={setShowNewUser}
              onUserUpdate={handleUpdateUser}
              onUserAdd={handleAddUser}
              onUserDelete={handleDeleteUser}
            />
          ) : activeTab === 'businesses' ? (
            <BusinessesPanel
              businesses={businesses}
              searchTerm={businessSearchTerm}
              selectedBusiness={selectedBusiness}
              showNewBusiness={showNewBusiness}
              onSearchChange={setBusinessSearchTerm}
              onSelectBusiness={setSelectedBusiness}
              onShowNewBusiness={setShowNewBusiness}
              onBusinessUpdate={handleUpdateBusiness}
              onBusinessAdd={handleAddBusiness}
              onBusinessDelete={handleDeleteBusiness}
            />
          ) : (
            <ReportDesignPanel />
          )}
        </div>
      </div>
    </div>
  )
}