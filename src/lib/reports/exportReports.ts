import { utils, writeFile } from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { type ReportData } from '../types/reports'
import { type ReportTemplate } from '../types/reports'
import { supabase } from '../supabase'

// Function to replace variables in text
async function replaceVariables(text: string, data: {
  dateRange: { start: string, end: string }
  user?: any
  page?: number
  pages?: number
  total?: number
  totalPrevious?: number
  difference?: number
}) {
  let result = text

  // Date variables
  result = result.replace('{start}', data.dateRange.start)
  result = result.replace('{end}', data.dateRange.end)

  // User variables
  if (data.user) {
    result = result.replace('{user.name}', data.user.name || '')
    result = result.replace('{user.lastName}', data.user.last_name || '')
    result = result.replace('{user.alias}', data.user.alias || '')
    result = result.replace('{user.email}', data.user.email || '')
    result = result.replace('{user.idNumber}', data.user.id_number || '')
    result = result.replace('{user.idType}', data.user.id_type || '')
  }

  // Pagination variables
  if (data.page !== undefined) {
    result = result.replace('{page}', data.page.toString())
  }
  if (data.pages !== undefined) {
    result = result.replace('{pages}', data.pages.toString())
  }

  // Total variables
  if (data.total !== undefined) {
    result = result.replace('{total}', data.total.toFixed(1))
  }
  if (data.totalPrevious !== undefined) {
    result = result.replace('{totalPrevious}', data.totalPrevious.toFixed(1))
  }
  if (data.difference !== undefined) {
    result = result.replace('{difference}', data.difference.toFixed(1))
  }

  return result
}

export async function exportToPDF(
  reportData: ReportData[],
  dateRange: { start: string, end: string },
  comparisonType: string,
  template: ReportTemplate
) {
  try {
  const doc = new jsPDF()

  // Get current user data
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Calculate totals
  const total = reportData.reduce((sum, data) => sum + data.hours, 0)
  const totalPrevious = reportData.reduce((sum, data) => sum + (data.comparisonHours || 0), 0)
  const difference = comparisonType === 'custom' ? total - totalPrevious : undefined

  // Apply template styles
  const { styles } = template

  // Title
  doc.setFont(styles.fonts.title)
  doc.setTextColor(styles.colors.text)
  doc.setFontSize(16)
  const title = await replaceVariables(styles.texts?.title || 'Informe de Horas', {
    dateRange,
    user: userData,
    total,
    totalPrevious,
    difference
  })
  doc.text(title, 14, 20)

  // Subtitle
  doc.setFont(styles.fonts.body)
  doc.setFontSize(12)
  const periodText = await replaceVariables(styles.texts?.period || 'Período: {start} - {end}', {
    dateRange,
    user: userData,
    total,
    totalPrevious,
    difference
  })
  doc.text(periodText, 14, 30)

  // Data table
  const headers = ['Empresa', 'Horas']
  if (comparisonType === 'custom') {
    headers.push('Período Anterior', 'Diferencia', 'Cambio %')
  }

  // Prepare rows including the total row
  const rows = [
    ...reportData.map(data => {
      const row = [data.businessName, data.hours.toFixed(1)]
      if (comparisonType === 'custom') {
        row.push(
          data.comparisonHours?.toFixed(1) || '0',
          data.difference?.toFixed(1) || '0',
          data.percentageChange?.toFixed(1) + '%' || '0%'
        )
      }
      return row
    }),
    // Add total row
    [
      'TOTAL',
      total.toFixed(1),
      ...(comparisonType === 'custom' ? [
        totalPrevious.toFixed(1),
        difference?.toFixed(1) || '0',
        (((total - totalPrevious) / totalPrevious) * 100).toFixed(1) + '%'
      ] : [])
    ]
  ]

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    theme: 'grid',
    styles: {
      font: styles.fonts.body,
      textColor: styles.colors.text,
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: styles.colors.primary,
      textColor: '#FFFFFF',
      fontStyle: 'bold'
    },
    // Style for total row
    didParseCell: function(data) {
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = '#f3f4f6'
        data.cell.styles.textColor = '#111827'
      }
    }
  })

  // Footer
  if (styles.footer.show) {
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const footerText = await replaceVariables(styles.footer.text, {
        dateRange,
        user: userData,
        page: i,
        pages: pageCount,
        total,
        totalPrevious,
        difference
      })
      doc.text(footerText, 14, doc.internal.pageSize.height - 10)
    }
  }

  // Save PDF
  doc.save(`reporte_horas_${dateRange.start}_${dateRange.end}.pdf`)
  } catch (error) {
    console.error('Error exporting to PDF:', error)
  }
}

export function exportToXLSX(
  reportData: ReportData[],
  dateRange: { start: string, end: string },
  comparisonType: string
) {
  try {
  const headers = ['Empresa', 'Horas']
  if (comparisonType === 'custom') {
    headers.push('Horas (Período Anterior)', 'Diferencia', 'Cambio %')
  }

  // Calculate totals
  const total = reportData.reduce((sum, data) => sum + data.hours, 0)
  const totalPrevious = reportData.reduce((sum, data) => sum + (data.comparisonHours || 0), 0)
  const difference = comparisonType === 'custom' ? total - totalPrevious : undefined
  const percentageChange = comparisonType === 'custom' && totalPrevious > 0
    ? ((total - totalPrevious) / totalPrevious) * 100
    : undefined

  // Prepare rows including the total row
  const rows = [
    ...reportData.map(data => {
      const row = [data.businessName, data.hours.toFixed(1)]
      if (comparisonType === 'custom') {
        row.push(
          data.comparisonHours?.toFixed(1) || '0',
          data.difference?.toFixed(1) || '0',
          data.percentageChange?.toFixed(1) + '%' || '0%'
        )
      }
      return row
    }),
    // Add total row
    [
      'TOTAL',
      total.toFixed(1),
      ...(comparisonType === 'custom' ? [
        totalPrevious.toFixed(1),
        difference?.toFixed(1) || '0',
        percentageChange?.toFixed(1) + '%' || '0%'
      ] : [])
    ]
  ]

  const ws = utils.aoa_to_sheet([headers, ...rows])

  // Style the total row
  const totalRowIndex = rows.length + 1 // +1 for header row
  const range = utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = utils.encode_cell({ r: totalRowIndex - 1, c: col })
    if (!ws[cellRef]) ws[cellRef] = { v: '' }
    ws[cellRef].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "F3F4F6" } }
    }
  }

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Reporte')

  writeFile(wb, `reporte_horas_${dateRange.start}_${dateRange.end}.xlsx`)
  } catch (error) {
    console.error('Error exporting to XLSX:', error)
  }
}