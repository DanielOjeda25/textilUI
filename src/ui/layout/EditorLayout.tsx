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
  const workAreaRef = useRef<HTMLDivElement | null>(null)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const measure = () => {
      const wa = workAreaRef.current?.getBoundingClientRect()
      const sb = sidebarRef.current?.getBoundingClientRect()
      const tb = toolbarRef.current?.getBoundingClientRect()
      const topbarH = 48
      const min = 200
      const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800
      let width = 0
      // height must be independent of canvas and workArea children
      const height = Math.max(min, Math.floor(viewportH - topbarH))
      if (wa) {
        width = Math.max(min, Math.floor(wa.width - (tb?.width ?? 0)))
        console.log('[EditorLayout] workArea measured', wa.width, wa.height)
      } else {
        width = Math.max(min, Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) - (sb?.width ?? 64) - (tb?.width ?? 16)))
      }
      console.log('[EditorLayout] sidebar', sb?.width ?? 64)
      console.log('[EditorLayout] toolbar', tb?.width ?? 16)
      console.log('[EditorLayout] canvas final', width, height)
      const prev = lastSizeRef.current
      if (prev.w !== width || prev.h !== height) {
        lastSizeRef.current = { w: width, h: height }
        setSize({ width, height })
      }
    }
    const ro = new ResizeObserver(measure)
    // Observe only stable sources: sidebar and toolbar. Avoid observing workArea if its height depends on canvas.
    if (toolbarRef.current) ro.observe(toolbarRef.current)
    if (sidebarRef.current) ro.observe(sidebarRef.current)
    measure()
    const onWin = () => { measure() }
    window.addEventListener('resize', onWin)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onWin)
    }
  }, [])

  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="h-12 bg-neutral-100 border-b border-neutral-300 flex items-center px-3 gap-2 z-20">
        <span className="text-sm text-neutral-600 flex-1">Topbar</span>
        <TopbarUndoRedo />
      </div>
      <div className="flex flex-1 overflow-hidden h-full min-h-0">
        <aside ref={sidebarRef} className="w-64 flex-shrink-0 h-full bg-[#f7f7f7] border-r border-neutral-300 overflow-y-auto z-20">
          <LayersPanel />
        </aside>
        <main ref={workAreaRef} className="flex-1 flex overflow-hidden min-w-0 min-h-0 items-stretch">
          <div ref={toolbarRef} className="w-16 flex-shrink-0 h-full flex flex-col bg-neutral-900 text-neutral-200 border-r border-neutral-700 z-20">
            <Toolbar onSelectFile={(file) => { void createLayerFromFile([file]) }} onOpenText={() => setTextOpen(true)} />
          </div>

          <div className="flex-1 overflow-hidden relative bg-neutral-800 z-0 min-w-0 min-h-0">
            <PixiCanvas width={size.width || 1200} height={size.height || 800} />
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
