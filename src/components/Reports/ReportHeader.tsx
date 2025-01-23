import { ArrowLeft } from 'lucide-react'

interface ReportHeaderProps {
  onBack: () => void
}

export default function ReportHeader({ onBack }: ReportHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={onBack}
        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        title="Volver"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>
      <h1 className="text-2xl font-bold dark:text-white">Informes</h1>
    </div>
  )
}