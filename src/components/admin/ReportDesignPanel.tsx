import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { ReportTemplate } from './reports/types'
import TemplateList from './reports/TemplateList'
import TemplateEditor from './reports/TemplateEditor'
import NewTemplateForm from './reports/NewTemplateForm'

export default function ReportDesignPanel() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'pdf' as const
  })

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at')

      if (error) {
        console.error('Error loading templates:', error)
        return
      }

      setTemplates(data.map(template => ({
        ...template,
        fields: template.fields || []
      })))
    }

    loadTemplates()
  }, [])

  // Handle template creation
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          name: newTemplate.name,
          type: newTemplate.type,
          fields: [],
          styles: {
            colors: {
              primary: '#3B82F6',
              secondary: '#1F2937',
              text: '#111827',
              background: '#FFFFFF'
            },
            fonts: {
              title: 'Helvetica',
              body: 'Arial'
            },
            header: {
              show: true,
              height: 80,
              alignment: 'left'
            },
            footer: {
              show: true,
              height: 50,
              text: 'Página {page} de {pages}'
            }
          }
        })
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => [...prev, data])
      setShowNewForm(false)
      setNewTemplate({ name: '', type: 'pdf' })
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      setTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  // Handle template updates
  const handleUpdateTemplate = async (templateId: string, updates: Partial<ReportTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('report_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error

      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, ...data } : t))
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(prev => prev ? { ...prev, ...data } : prev)
      }
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  // Handle logo upload
  const handleLogoUpload = async (templateId: string, file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('report-logos')
        .upload(`${templateId}/${file.name}`, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('report-logos')
        .getPublicUrl(data.path)

      await handleUpdateTemplate(templateId, {
        styles: {
          ...selectedTemplate!.styles,
          logo: {
            type: 'url',
            content: publicUrl
          }
        }
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
    }
  }

  return (
    <div>
      {showNewForm ? (
        <NewTemplateForm
          name={newTemplate.name}
          type={newTemplate.type}
          onNameChange={(name) => setNewTemplate(prev => ({ ...prev, name }))}
          onTypeChange={(type) => setNewTemplate(prev => ({ ...prev, type }))}
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowNewForm(false)}
        />
      ) : selectedTemplate ? (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUpdate={handleUpdateTemplate}
          onLogoUpload={handleLogoUpload}
        />
      ) : (
        <TemplateList
          templates={templates}
          onSelect={setSelectedTemplate}
          onDelete={handleDeleteTemplate}
          onNew={() => setShowNewForm(true)}
        />
      )}
    </div>
  )
}