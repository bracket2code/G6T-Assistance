import { Building2, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import EditBusinessForm from '../Forms/Business/EditBusinessForm'
import NewBusinessForm from '../Forms/Business/NewBusinessForm'

type Business = {
  id: string
  name: string
  address: string
  email: string
  tax_id: string
  notes: string
  active: boolean
  created_at: string
}

interface BusinessesPanelProps {
  businesses: Business[]
  searchTerm: string
  selectedBusiness: Business | null
  showNewBusiness: boolean
  onSearchChange: (term: string) => void
  onSelectBusiness: (business: Business | null) => void
  onShowNewBusiness: (show: boolean) => void
  onBusinessUpdate: (business: Business) => void
  onBusinessAdd: (business: Omit<Business, 'id'>) => void
  onBusinessDelete: (businessId: string) => void
}

export default function BusinessesPanel({
  businesses,
  searchTerm,
  selectedBusiness,
  showNewBusiness,
  onSearchChange,
  onSelectBusiness,
  onShowNewBusiness,
  onBusinessUpdate,
  onBusinessAdd,
  onBusinessDelete
}: BusinessesPanelProps) {
  const filteredBusinesses = businesses.filter(business => {
    const searchLower = searchTerm.toLowerCase()
    return business.name?.toLowerCase().includes(searchLower)
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 dark:text-white">
          <Building2 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold">Empresas</h2>
        </div>
        <button
          type="button"
          onClick={() => onShowNewBusiness(true)}
          className="flex items-center justify-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline md:hidden">Añadir</span>
          <span className="hidden md:inline">Añadir Empresa</span>
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar empresas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {showNewBusiness && (
        <NewBusinessForm
          onBack={() => onShowNewBusiness(false)}
          onSave={onBusinessAdd}
        />
      )}

      {selectedBusiness ? (
        <EditBusinessForm
          business={selectedBusiness}
          onBack={() => onSelectBusiness(null)}
          onSave={onBusinessUpdate}
        />
      ) : (
        <div className="space-y-3">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <div className="flex-1">
                <div className="text-left font-medium dark:text-white">{business.name}</div>
                <div className="text-left text-sm text-gray-600 dark:text-gray-300">{business.tax_id || 'Sin CIF/NIF'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectBusiness(business)}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onBusinessDelete(business.id)}
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
  )
}