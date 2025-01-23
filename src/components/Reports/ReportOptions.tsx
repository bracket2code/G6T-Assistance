import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface ReportOptionsProps {
  templateId: string
  onChange: (options: {
    showShiftNotes: boolean
    showDailyNotes: boolean
    showTimes: boolean
  }) => void
}

export default function ReportOptions({ templateId, onChange }: ReportOptionsProps) {
  const [options, setOptions] = useState({
    showShiftNotes: false,
    showDailyNotes: false,
    showTimes: false
  })

  // Load options from database
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // First try to delete any existing options
        await supabase
          .from('report_options')
          .delete()
          .eq('report_template_id', templateId)

        // Then create new options with default values
        const { data, error } = await supabase
          .from('report_options')
          .insert({
            report_template_id: templateId,
            show_shift_notes: false,
            show_daily_notes: false,
            show_times: false
          })
          .select()
          .single()

        if (error) throw error

        if (data) {
          const newOptions = {
            showShiftNotes: data.show_shift_notes,
            showDailyNotes: data.show_daily_notes,
            showTimes: data.show_times
          }
          setOptions(newOptions)
          onChange(newOptions)
        }
      } catch (error) {
        console.error('Error loading report options:', error)
      }
    }

    if (templateId) {
      loadOptions()
    }
  }, [templateId])

  // Save options to database
  const handleOptionChange = async (key: keyof typeof options, value: boolean) => {
    try {
      const newOptions = { ...options, [key]: value }
      setOptions(newOptions)
      onChange(newOptions)

      const { error } = await supabase
        .from('report_options')
        .update({
          show_shift_notes: newOptions.showShiftNotes,
          show_daily_notes: newOptions.showDailyNotes,
          show_times: newOptions.showTimes
        })
        .eq('report_template_id', templateId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating report options:', error)
    }
  }

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Opciones del informe
      </h3>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.showShiftNotes}
            onChange={(e) => handleOptionChange('showShiftNotes', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Mostrar notas de los turnos
          </span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.showDailyNotes}
            onChange={(e) => handleOptionChange('showDailyNotes', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Mostrar notas del día
          </span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.showTimes}
            onChange={(e) => handleOptionChange('showTimes', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Mostrar horas de entrada y salida
          </span>
        </label>
      </div>
    </div>
  )
}