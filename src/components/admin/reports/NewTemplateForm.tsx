import { Plus } from 'lucide-react'

interface NewTemplateFormProps {
  name: string
  type: 'pdf' | 'xlsx'
  onNameChange: (name: string) => void
  onTypeChange: (type: 'pdf' | 'xlsx') => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function NewTemplateForm({
  name,
  type,
  onNameChange,
  onTypeChange,
  onSubmit,
  onCancel
}: NewTemplateFormProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-4 dark:text-white">Nueva Plantilla</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la plantilla
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Ej: Informe Mensual"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de informe
          </label>
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value as 'pdf' | 'xlsx')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500"
          >
            Crear Plantilla
          </button>
        </div>
      </form>
    </div>
  )
}