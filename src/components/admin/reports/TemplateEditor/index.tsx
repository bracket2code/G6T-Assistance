import StylesEditor from './StylesEditor'
import FieldsEditor from './FieldsEditor'
import type { ReportTemplate } from '../types'

interface TemplateEditorProps {
  template: ReportTemplate
  onClose: () => void
  onUpdate: (templateId: string, updates: Partial<ReportTemplate>) => void
  onLogoUpload: (templateId: string, file: File) => void
}

export default function TemplateEditor({
  template,
  onClose,
  onUpdate,
  onLogoUpload
}: TemplateEditorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold dark:text-white">
            {template.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StylesEditor
            template={template}
            onUpdate={onUpdate}
            onLogoUpload={onLogoUpload}
          />
          <FieldsEditor
            template={template}
            onUpdate={onUpdate}
          />
        </div>
      </div>
    </div>
  )
}