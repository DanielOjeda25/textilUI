import { useRef, useState } from 'react'
import Modal from '../components/Modal'
import { useImportStore } from '../../state/useImportStore'
import { importImage } from '../../utils/importImage'
import { useCanvasStore } from '../../state/useCanvasStore'

export default function ImportModal() {
  const { isOpen, close, loading, setLoading } = useImportStore()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function onSelectClick() {
    inputRef.current?.click()
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (f) setPreviewUrl(URL.createObjectURL(f))
  }

  async function onImport() {
    if (!file || loading) return
    setLoading(true)
    try {
      const layer = await importImage(file)
      useCanvasStore.getState().addLayer(layer)
      useCanvasStore.getState().selectLayer(layer.id)
      setFile(null)
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      close()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={close}>
      <div className="w-[360px] max-w-full flex flex-col gap-3">
        <div className="text-sm font-medium">Importar imagen</div>
        {previewUrl && (
          <div className="w-full h-32 bg-neutral-100 border border-neutral-300 rounded flex items-center justify-center overflow-hidden">
            <img src={previewUrl} alt="preview" className="max-h-32 object-contain" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-neutral-200 rounded" onClick={onSelectClick} disabled={loading}>Seleccionar archivo</button>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={onChange} />
          <span className="text-xs text-neutral-600 truncate flex-1">{file ? file.name : 'Ningún archivo seleccionado'}</span>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 bg-neutral-200 rounded" onClick={close} disabled={loading}>Cancelar</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={onImport} disabled={!file || loading}>{loading ? 'Importando…' : 'Importar'}</button>
        </div>
      </div>
    </Modal>
  )
}

