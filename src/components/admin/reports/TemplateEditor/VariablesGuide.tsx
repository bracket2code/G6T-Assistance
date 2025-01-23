import { Info } from 'lucide-react'

export default function VariablesGuide() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
      <div className="flex items-start gap-2">
        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
        <div>
          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Variables disponibles
          </h5>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">Fechas:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>{'{start}'}</code> - Fecha de inicio del período</li>
              <li><code>{'{end}'}</code> - Fecha de fin del período</li>
            </ul>

            <p className="font-medium mt-3">Usuario:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>{'{user.name}'}</code> - Nombre del usuario</li>
              <li><code>{'{user.lastName}'}</code> - Apellidos del usuario</li>
              <li><code>{'{user.alias}'}</code> - Alias del usuario</li>
              <li><code>{'{user.email}'}</code> - Email del usuario</li>
              <li><code>{'{user.idNumber}'}</code> - Número de identificación</li>
              <li><code>{'{user.idType}'}</code> - Tipo de identificación</li>
            </ul>

            <p className="font-medium mt-3">Paginación:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>{'{page}'}</code> - Número de página actual</li>
              <li><code>{'{pages}'}</code> - Total de páginas</li>
            </ul>

            <p className="font-medium mt-3">Totales:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><code>{'{total}'}</code> - Total de horas del período</li>
              <li><code>{'{totalPrevious}'}</code> - Total de horas del período anterior</li>
              <li><code>{'{difference}'}</code> - Diferencia entre períodos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}