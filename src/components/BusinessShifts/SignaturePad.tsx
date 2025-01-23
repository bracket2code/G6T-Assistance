import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '../../lib/supabase'
import { Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { Signature } from '../../types/attendance'

interface SignaturePadProps {
  businessId: string
  userId: string
  date: string
  onSignatureComplete: () => void
}

export default function SignaturePad({ 
  businessId, 
  userId, 
  date,
  onSignatureComplete 
}: SignaturePadProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [signature, setSignature] = useState<Signature | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const signatureRef = useRef<SignatureCanvas>(null)

  // Cargar firma existente
  const loadSignature = async () => {
    try {
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .eq('user_id', userId)
        .eq('business_id', businessId)
        .eq('date', date)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setSignature(data)
        const { data: { publicUrl } } = supabase.storage
          .from('signatures')
          .getPublicUrl(data.signature_url)
        setSignatureUrl(publicUrl)
      } else {
        setSignature(null)
        setSignatureUrl(null)
      }
    } catch (err) {
      console.error('Error loading signature:', err)
      setSignature(null)
      setSignatureUrl(null)
    }
  }

  useEffect(() => {
    loadSignature()
  }, [userId, businessId, date])

  const handleSave = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Por favor, dibuja tu firma primero')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Si ya existe una firma, eliminarla primero
      if (signature) {
        await handleDelete(false) // No recargar después de eliminar
      }

      // Get signature as base64 PNG
      const signatureData = signatureRef.current.toDataURL('image/png')
      const base64Data = signatureData.split(',')[1]

      // Convert base64 to Blob
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // Upload to Supabase Storage
      const fileName = `${userId}_${businessId}_${date}_${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      // Save signature record in database
      const { data, error: dbError } = await supabase
        .from('signatures')
        .insert({
          user_id: userId,
          business_id: businessId,
          date,
          signature_url: fileName
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Recargar la firma para asegurar que se muestra la más reciente
      await loadSignature()
      onSignatureComplete()
    } catch (err) {
      console.error('Error saving signature:', err)
      setError('Error al guardar la firma')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reload = true) => {
    if (!signature) return

    setLoading(true)
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('signatures')
        .remove([signature.signature_url])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('signatures')
        .delete()
        .eq('id', signature.id)

      if (dbError) throw dbError

      if (reload) {
        await loadSignature() // Recargar para verificar que se eliminó correctamente
      } else {
        setSignature(null)
        setSignatureUrl(null)
      }

      if (signatureRef.current) {
        signatureRef.current.clear()
      }
    } catch (err) {
      console.error('Error deleting signature:', err)
      setError('Error al eliminar la firma')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
      setError(null)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
      <div 
        className="flex items-center justify-between px-2 h-[40px] bg-white dark:bg-gray-800 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center flex-1">
          <h3 className="text-xl font-semibold text-center w-full dark:text-gray-200">
            Firma
          </h3>
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t dark:border-gray-700">
          <div className="space-y-3 p-2">
            {signature && signatureUrl ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                  <img 
                    src={signatureUrl + '?t=' + Date.now()} // Evitar caché
                    alt="Firma" 
                    className="w-full h-40 object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-500 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Eliminar Firma
                </button>
              </div>
            ) : (
              <>
                <div className="border rounded-lg mb-4 bg-white dark:bg-gray-900">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full h-40',
                      style: { 
                        borderRadius: '0.5rem',
                        touchAction: 'none'
                      }
                    }}
                    backgroundColor="transparent"
                    penColor="#3B82F6" // Color azul que funciona bien en ambos modos
                  />
                </div>

                {error && (
                  <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded dark:bg-red-900/50 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Borrar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar Firma
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}