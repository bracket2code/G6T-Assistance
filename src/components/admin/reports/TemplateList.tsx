import { FileText, Plus, Trash2 } from 'lucide-react'
import type { ReportTemplate } from './types'

interface TemplateListProps {
  templates: ReportTemplate[]
  onSelect: (template: ReportTemplate) => void
  onDelete: (templateId: string) => void
  onNew: () => void
}

export default function TemplateList({ templates, onSelect, onDelete, onNew }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No hay plantillas de informes diseñadas
        </p>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
        >
          <Plus className="w-4 h-4" />
          Crear primera plantilla
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map(template => (
        <div
          key={template.id}
          className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer dark:border-gray-700 dark:hover:border-blue-400"
          onClick={() => onSelect(template)}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium dark:text-white">{template.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs uppercase ${
                template.type === 'pdf' 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {template.type}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(template.id)
                }}
                className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {template.fields.length} campos configurados
          </div>
          <div className="mt-2 space-y-1">
            {template.fields.map(field => (
              <div
                key={field.id}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                • {field.name} ({field.type})
                {field.width && ` - ${field.width}%`}
                {field.format && ` - ${field.format}`}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}