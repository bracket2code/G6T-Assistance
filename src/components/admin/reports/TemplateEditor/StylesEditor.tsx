import { Upload, Code, Info } from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import type { ReportTemplate } from '../types'
import { useState } from 'react'
import VariablesGuide from './VariablesGuide'

interface StylesEditorProps {
  template: ReportTemplate
  onUpdate: (templateId: string, updates: Partial<ReportTemplate>) => void
  onLogoUpload: (templateId: string, file: File) => void
}

export default function StylesEditor({
  template,
  onUpdate,
  onLogoUpload
}: StylesEditorProps) {
  const [showSvgInput, setShowSvgInput] = useState(false)
  const [svgCode, setSvgCode] = useState(template.svg_logo || '')
  const [showVariables, setShowVariables] = useState(false)

  const handleSvgSubmit = async () => {
    if (svgCode) {
      try {
        const { error } = await supabase
          .from('report_templates')
          .update({ svg_logo: svgCode })
          .eq('id', template.id)

        if (error) throw error

        onUpdate(template.id, {
          svg_logo: svgCode
        })
        setShowSvgInput(false)
      } catch (error) {
        console.error('Error saving SVG logo:', error)
      }
    }
  }

  return (
    <div>
      <h4 className="font-medium mb-4 dark:text-white">Estilos del informe</h4>

      {/* Variables Guide Toggle */}
      <button
        onClick={() => setShowVariables(!showVariables)}
        className="mb-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
      >
        <Info className="w-4 h-4" />
        {showVariables ? 'Ocultar variables' : 'Ver variables disponibles'}
      </button>

      {/* Variables Guide */}
      {showVariables && <VariablesGuide />}
      
      {/* Textos */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Textos
        </h5>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Título del informe
            </label>
            <input
              type="text"
              value={template.styles.texts?.title || 'Informe de Horas'}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  texts: {
                    ...template.styles.texts,
                    title: e.target.value
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ej: Informe de Horas de {user.name}"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Texto del período
            </label>
            <input
              type="text"
              value={template.styles.texts?.period || 'Período: {start} - {end}'}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  texts: {
                    ...template.styles.texts,
                    period: e.target.value
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Ej: Del {start} al {end}"
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Logo
        </label>
        <div className="flex flex-col gap-4">
          {/* Logo Preview */}
          <div className="h-16 w-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden">
            {template.svg_logo ? (
              <div dangerouslySetInnerHTML={{ __html: template.svg_logo }} />
            ) : template.styles.logo?.content ? (
              <img 
                src={template.styles.logo.content} 
                alt="Logo" 
                className="h-full w-auto object-contain"
              />
            ) : (
              <span className="text-sm text-gray-500 dark:text-gray-400">Sin logo</span>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex gap-2">
            <label className="cursor-pointer flex items-center gap-1 text-blue-600 hover:text-blue-500 px-3 py-1 border border-blue-600 rounded">
              <input
                type="file"
                accept=".svg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    if (file.type === 'image/svg+xml') {
                      const reader = new FileReader()
                      reader.onload = async (e) => {
                        const svgContent = e.target?.result as string
                        try {
                          const { error } = await supabase
                            .from('report_templates')
                            .update({ svg_logo: svgContent })
                            .eq('id', template.id)

                          if (error) throw error

                          onUpdate(template.id, {
                            svg_logo: svgContent
                          })
                        } catch (error) {
                          console.error('Error saving SVG logo:', error)
                        }
                      }
                      reader.readAsText(file)
                    } else {
                      onLogoUpload(template.id, file)
                    }
                  }
                }}
              />
              <Upload className="w-4 h-4" />
              <span className="text-sm">Subir SVG</span>
            </label>

            <button
              type="button"
              onClick={() => setShowSvgInput(!showSvgInput)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-500 px-3 py-1 border border-blue-600 rounded"
            >
              <Code className="w-4 h-4" />
              <span className="text-sm">Código SVG</span>
            </button>
          </div>

          {/* SVG Code Input */}
          {showSvgInput && (
            <div className="space-y-2">
              <textarea
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                placeholder="Pega aquí tu código SVG"
                className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSvgInput(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSvgSubmit}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-500"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colores */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Colores
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Color primario
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={template.styles.colors.primary}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    colors: {
                      ...template.styles.colors,
                      primary: e.target.value
                    }
                  }
                })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={template.styles.colors.primary}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    colors: {
                      ...template.styles.colors,
                      primary: e.target.value
                    }
                  }
                })}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Color secundario
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={template.styles.colors.secondary}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    colors: {
                      ...template.styles.colors,
                      secondary: e.target.value
                    }
                  }
                })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={template.styles.colors.secondary}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    colors: {
                      ...template.styles.colors,
                      secondary: e.target.value
                    }
                  }
                })}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fuentes */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fuentes
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Fuente de títulos
            </label>
            <select
              value={template.styles.fonts.title}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  fonts: {
                    ...template.styles.fonts,
                    title: e.target.value
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Helvetica">Helvetica</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier">Courier</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Fuente de texto
            </label>
            <select
              value={template.styles.fonts.body}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  fonts: {
                    ...template.styles.fonts,
                    body: e.target.value
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier">Courier</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tamaños de fuente */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tamaños de fuente
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Tamaño de títulos
            </label>
            <input
              type="number"
              min="8"
              max="72"
              value={template.styles.fontSize?.title || 16}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  fontSize: {
                    ...template.styles.fontSize,
                    title: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Tamaño de texto
            </label>
            <input
              type="number"
              min="8"
              max="72"
              value={template.styles.fontSize?.body || 12}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  fontSize: {
                    ...template.styles.fontSize,
                    body: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Márgenes */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Márgenes (mm)
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Superior
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={template.styles.margins?.top || 20}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  margins: {
                    ...template.styles.margins,
                    top: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Derecho
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={template.styles.margins?.right || 20}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  margins: {
                    ...template.styles.margins,
                    right: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Inferior
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={template.styles.margins?.bottom || 20}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  margins: {
                    ...template.styles.margins,
                    bottom: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Izquierdo
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={template.styles.margins?.left || 20}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  margins: {
                    ...template.styles.margins,
                    left: parseInt(e.target.value)
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Orientación y tamaño de página */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Página
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Orientación
            </label>
            <select
              value={template.styles.page?.orientation || 'portrait'}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  page: {
                    ...template.styles.page,
                    orientation: e.target.value as 'portrait' | 'landscape'
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="portrait">Vertical</option>
              <option value="landscape">Horizontal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Tamaño
            </label>
            <select
              value={template.styles.page?.size || 'a4'}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  page: {
                    ...template.styles.page,
                    size: e.target.value
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="a4">A4</option>
              <option value="a3">A3</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estilos de tabla */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Estilos de tabla
        </h5>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Estilo de bordes
            </label>
            <select
              value={template.styles.table?.borderStyle || 'grid'}
              onChange={(e) => onUpdate(template.id, {
                styles: {
                  ...template.styles,
                  table: {
                    ...template.styles.table,
                    borderStyle: e.target.value
                  }
                }
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="grid">Cuadrícula</option>
              <option value="striped">Alternado</option>
              <option value="minimal">Mínimo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Color de fondo de cabecera
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={template.styles.table?.headerBackground || '#f3f4f6'}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    table: {
                      ...template.styles.table,
                      headerBackground: e.target.value
                    }
                  }
                })}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={template.styles.table?.headerBackground || '#f3f4f6'}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    table: {
                      ...template.styles.table,
                      headerBackground: e.target.value
                    }
                  }
                })}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Colores
        </h5>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(template.styles.colors).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {key === 'primary' ? 'Color primario' :
                 key === 'secondary' ? 'Color secundario' :
                 key === 'text' ? 'Color de texto' : 'Color de fondo'}
              </label>
              <input
                type="color"
                value={value}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    colors: {
                      ...template.styles.colors,
                      [key]: e.target.value
                    }
                  }
                })}
                className="w-full h-8 rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fuentes */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fuentes
        </h5>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(template.styles.fonts).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {key === 'title' ? 'Fuente de títulos' : 'Fuente de texto'}
              </label>
              <select
                value={value}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    fonts: {
                      ...template.styles.fonts,
                      [key]: e.target.value
                    }
                  }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Helvetica">Helvetica</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Encabezado y Pie de página */}
      {['header', 'footer'].map((section) => (
        <div key={section} className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {section === 'header' ? 'Encabezado' : 'Pie de página'}
          </h5>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={template.styles[section].show}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    [section]: {
                      ...template.styles[section],
                      show: e.target.checked
                    }
                  }
                })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {section === 'header' ? 'Mostrar encabezado' : 'Mostrar pie de página'}
              </span>
            </label>
            
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Altura (px)
              </label>
              <input
                type="number"
                value={template.styles[section].height}
                onChange={(e) => onUpdate(template.id, {
                  styles: {
                    ...template.styles,
                    [section]: {
                      ...template.styles[section],
                      height: parseInt(e.target.value)
                    }
                  }
                })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {section === 'header' ? (
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Alineación
                </label>
                <select
                  value={template.styles.header.alignment}
                  onChange={(e) => onUpdate(template.id, {
                    styles: {
                      ...template.styles,
                      header: {
                        ...template.styles.header,
                        alignment: e.target.value as 'left' | 'center' | 'right'
                      }
                    }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Texto
                </label>
                <input
                  type="text"
                  value={template.styles.footer.text}
                  onChange={(e) => onUpdate(template.id, {
                    styles: {
                      ...template.styles,
                      footer: {
                        ...template.styles.footer,
                        text: e.target.value
                      }
                    }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Usa {page} y {pages} para números de página"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}