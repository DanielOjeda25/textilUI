import { useLayoutEffect, useRef, useState } from 'react'
import LayersPanel from '../panels/LayersPanel'
import Toolbar from '../toolbar/Toolbar'
import PixiCanvas from '../../canvas/PixiCanvas'
import Modal from '../components/Modal'
import FileImporter from '../components/FileImporter'
import { createLayerFromFile } from '../../app/createLayerFromFile'
import { LayerFactory } from '../../canvas/layers/LayerFactory'
import { useCanvasStore } from '../../state/useCanvasStore'
import { useHistoryStore } from '../../state/useHistoryStore'
import { useShortcut } from '../../hooks/useShortcut'

export default function EditorLayout() {
  const [importOpen, setImportOpen] = useState(false)
  const [textOpen, setTextOpen] = useState(false)
  const [textValue, setTextValue] = useState('')
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    })
    ro.observe(el)
    const rect = el.getBoundingClientRect()
    setSize({ width: Math.floor(rect.width), height: Math.floor(rect.height) })
    return () => ro.disconnect()
  }, [])
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="h-12 bg-neutral-100 border-b border-neutral-300 flex items-center px-3 gap-2 z-20">
        <span className="text-sm text-neutral-600 flex-1">Topbar</span>
        <TopbarUndoRedo />
      </div>
      <div className="flex flex-1 overflow-hidden h-full">
        <aside className="w-64 h-full bg-[#f7f7f7] border-r border-neutral-300 overflow-y-auto z-20">
          <LayersPanel />
        </aside>
        <main className="flex-1 h-full flex overflow-hidden min-h-0">

          <div className="w-16 h-full flex flex-col bg-neutral-900 text-neutral-200 border-r border-neutral-700 z-20">
            <Toolbar onOpenImport={() => setImportOpen(true)} onOpenText={() => setTextOpen(true)} />
          </div>
          <div
            className="flex-1 h-full overflow-hidden relative bg-neutral-800 z-0 min-h-0"
            ref={canvasContainerRef}
          >
            {size.width > 0 && size.height > 0 && (
              <PixiCanvas width={size.width} height={size.height} />
            )}
          </div>
        </main>
        <Modal open={importOpen} onClose={() => setImportOpen(false)}>
          <FileImporter onFiles={async (files) => { await createLayerFromFile(files); setImportOpen(false) }} />
        </Modal>
        <Modal open={textOpen} onClose={() => setTextOpen(false)}>
          <div className="flex flex-col gap-2">
            <input className="border border-neutral-300 rounded px-2 py-1" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Escribir texto" />
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 bg-neutral-300 rounded" onClick={() => setTextOpen(false)}>Cancelar</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => {
                const v = useCanvasStore.getState().viewport
                const wx = (v.screenWidth / 2 - v.x) / v.scale
                const wy = (v.screenHeight / 2 - v.y) / v.scale
                const layer = LayerFactory.createText(textValue || 'Texto')
                const s = 1
                const next = { ...layer, x: wx - 50 * s, y: wy - 20 * s, scale: s, name: 'Texto' }
                useCanvasStore.getState().addLayer(next)
                useCanvasStore.getState().selectLayer(next.id)
                setTextOpen(false)
                setTextValue('')
              }}>Crear</button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

function TopbarUndoRedo() {
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)
  useShortcut(['Ctrl', 'Z'], undo)
  useShortcut(['Ctrl', 'Shift', 'Z'], redo)
  return (
    <div className="flex items-center gap-2">
      <button className="px-3 py-1 bg-neutral-300 rounded" onClick={undo}>Undo</button>
      <button className="px-3 py-1 bg-neutral-300 rounded" onClick={redo}>Redo</button>
    </div>
  )
}
