import { useState } from 'react'
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { type User } from '../../types/auth'
import EditUserForm from '../Forms/User/EditUserForm'
import NewUserForm from '../Forms/User/NewUserForm'

interface UsersPanelProps {
  users: User[]
  loading: boolean
  searchTerm: string
  selectedUser: User | null
  showNewUser: boolean
  onSearchChange: (term: string) => void
  onSelectUser: (user: User | null) => void
  onShowNewUser: (show: boolean) => void
  onUserUpdate: (user: User) => void
  onUserAdd: (user: Omit<User, 'id'>) => void
  onUserDelete: (userId: string) => void
}

export default function UsersPanel({
  users,
  loading,
  searchTerm,
  selectedUser,
  showNewUser,
  onSearchChange,
  onSelectUser,
  onShowNewUser,
  onUserUpdate,
  onUserAdd,
  onUserDelete
}: UsersPanelProps) {
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.idNumber && user.idNumber.toLowerCase().includes(searchLower))
    )
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 dark:text-white">
          <Users className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Usuarios</h2>
        </div>
        <button
          onClick={() => onShowNewUser(true)}
          className="flex items-center justify-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline md:hidden">Añadir</span>
          <span className="hidden md:inline">Añadir Usuario</span>
        </button>
      </div>

      {selectedUser ? (
        <EditUserForm
          user={selectedUser}
          onBack={() => onSelectUser(null)}
          onSave={onUserUpdate}
        />
      ) : (
        <>
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>
      
          {showNewUser && (
            <NewUserForm
              onBack={() => onShowNewUser(false)}
              onSave={onUserAdd}
            />
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando usuarios...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <div className="flex-1">
                    <div className="text-left font-medium dark:text-white">
                      {user.name} {user.lastName}
                    </div>
                    <div className="text-left text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </div>
                    <div className="text-left text-xs text-gray-500 dark:text-gray-400">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectUser(user)
                      }}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUserDelete(user.id)
                      }}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}