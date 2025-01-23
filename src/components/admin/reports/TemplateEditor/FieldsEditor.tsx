import type { ReportTemplate } from '../types'

interface FieldsEditorProps {
  template: ReportTemplate
  onUpdate: (templateId: string, updates: Partial<ReportTemplate>) => void
}

export default function FieldsEditor({ template, onUpdate }: FieldsEditorProps) {
  return (
    <div>
      <h4 className="font-medium mb-4 dark:text-white">Campos del informe</h4>
      <div className="space-y-2">
        {template.fields.map(field => (
          <div
            key={field.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded dark:bg-gray-700"
          >
            <div>
              <div className="font-medium dark:text-white">{field.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Tipo: {field.type}
                {field.width && ` • Ancho: ${field.width}%`}
                {field.format && ` • Formato: ${field.format}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}