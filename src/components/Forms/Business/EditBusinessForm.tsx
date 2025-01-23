import { ArrowLeft } from 'lucide-react'

type Business = {
  id: string
  name: string
  legal_name: string
  address: string
  email: string
  tax_id: string
  notes: string
  active: boolean
  created_at: string
}

interface EditBusinessFormProps {
  business: Business
  onBack: () => void
  onSave: (updatedBusiness: Business) => void
}

export default function EditBusinessForm({ business, onBack, onSave }: EditBusinessFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const updatedBusiness = {
      ...business,
      name: formData.get('commercialName') as string,
      legal_name: formData.get('legalName') as string,
      address: formData.get('address') as string,
      email: formData.get('email') as string,
      tax_id: formData.get('taxId') as string,
      notes: formData.get('notes') as string,
    }
    onSave(updatedBusiness)
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
        <h3 className="text-xl font-bold dark:text-white">Editar Empresa</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Comercial</label>
          <input
            type="text"
            name="commercialName"
            required
            defaultValue={business.name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Fiscal</label>
          <input
            type="text"
            name="legalName"
            required
            defaultValue={business.legal_name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
          <input
            type="text"
            name="address"
            defaultValue={business.address}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            required
            defaultValue={business.email}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">CIF/NIF</label>
          <input
            type="text"
            name="taxId"
            required
            defaultValue={business.tax_id}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
          <textarea
            name="notes"
            defaultValue={business.notes}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-20 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
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
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  )
}