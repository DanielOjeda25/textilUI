import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import LayersPanel from '../panels/LayersPanel'
import Toolbar from '../toolbar/Toolbar'
import KonvaCanvas from '../../canvas/KonvaCanvas'
import Modal from '../components/Modal'
import { createLayerFromFile } from '../../app/createLayerFromFile'
import { useImportStore } from '../../state/useImportStore'
import { LayerFactory } from '../../canvas/layers/LayerFactory'
import { useCanvasStore } from '../../state/useCanvasStore'
import { useHistoryStore } from '../../state/useHistoryStore'
import { useShortcut } from '../../hooks/useShortcut'
import { loadImage } from '../../canvas/utils/loadImage'

export default function EditorLayout() {
  const { open: openImport } = useImportStore()
  const [textOpen, setTextOpen] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const workAreaRef = useRef<HTMLDivElement | null>(null)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  useEffect(() => {
    const hydrate = async () => {
      const saved = localStorage.getItem('textilui-project')
      if (!saved) return
      try {
        const data = JSON.parse(saved) as { layers?: Array<{ type: 'raster' | 'vector' | 'text'; id: string; name: string; visible: boolean; locked: boolean; x: number; y: number; scale: number; rotation: number; selected: boolean; imageSrc?: string; svg?: string; text?: string }>; selectedLayerId?: string | null; viewport?: { x: number; y: number; scale: number; screenWidth: number; screenHeight: number } }
        if (Array.isArray(data.layers)) {
          const rebuilt: ReturnType<typeof useCanvasStore.getState>['layers'] = []
          for (const l of data.layers) {
            if (l.type === 'raster' && typeof l.imageSrc === 'string') {
              try {
                const img = await loadImage(l.imageSrc)
                const rl = LayerFactory.createRaster(img)
                rebuilt.push({ ...rl, id: l.id, name: l.name, visible: l.visible, locked: l.locked, x: l.x, y: l.y, scale: l.scale, rotation: l.rotation, selected: l.selected })
              } catch { /* ignore layer */ }
            } else if (l.type === 'vector' && typeof l.svg === 'string') {
              const vl = LayerFactory.createVector(l.svg)
              rebuilt.push({ ...vl, id: l.id, name: l.name, visible: l.visible, locked: l.locked, x: l.x, y: l.y, scale: l.scale, rotation: l.rotation, selected: l.selected })
            } else if (l.type === 'text' && typeof l.text === 'string') {
              const tl = LayerFactory.createText(l.text)
              rebuilt.push({ ...tl, id: l.id, name: l.name, visible: l.visible, locked: l.locked, x: l.x, y: l.y, scale: l.scale, rotation: l.rotation, selected: l.selected })
            }
          }
          useCanvasStore.setState((s) => ({ ...s, layers: rebuilt, selectedLayerId: data.selectedLayerId ?? s.selectedLayerId }))
        }
      } catch { /* ignore */ }
    }
    void hydrate()
    const unsub = useCanvasStore.subscribe((s) => {
      const layers = s.layers.map((l) => {
        if (l.type === 'raster') return { ...l, imageSrc: l.image.src, image: undefined }
        if (l.type === 'vector') return { ...l }
        if (l.type === 'text') return { ...l }
        return l
      })
      const payload = { layers, selectedLayerId: s.selectedLayerId, viewport: s.viewport }
      localStorage.setItem('textilui-project', JSON.stringify(payload))
    })
    return () => { unsub() }
  }, [])

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
      } else {
        width = Math.max(min, Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1200) - (sb?.width ?? 64) - (tb?.width ?? 16)))
      }

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
    <div className="flex h-screen w-screen flex-col">
      <div className="z-20 flex h-12 items-center gap-2 border-b border-neutral-300 bg-neutral-100 px-3">
        <button className="rounded bg-neutral-300 px-3 py-1 md:hidden" onClick={() => setSidebarOpen(true)}>Menu</button>
        <span className="flex-1 text-sm text-neutral-600">Topbar</span>
        <button className="hidden rounded bg-blue-600 px-3 py-1 text-white md:inline-flex" onClick={() => openImport()}>Importar</button>
        <button className="hidden rounded bg-neutral-800 px-3 py-1 text-white md:inline-flex" onClick={exportPNG}>Exportar PNG</button>
        <TopbarUndoRedo />
      </div>
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        <aside ref={sidebarRef} className="z-20 hidden h-full flex-shrink-0 overflow-y-auto border-r border-neutral-300 bg-[#f7f7f7] md:block md:w-14 lg:w-64">
          <LayersPanel />
        </aside>
        <main ref={workAreaRef} className="flex min-h-0 min-w-0 flex-1 items-stretch overflow-hidden">
          <div ref={toolbarRef} className="z-20 flex hidden h-full flex-shrink-0 flex-col border-r border-neutral-700 bg-neutral-900 text-neutral-200 md:flex md:w-12 lg:w-16">
            <Toolbar onSelectFile={(file) => { void createLayerFromFile([file]) }} onOpenText={() => setTextOpen(true)} />
          </div>

          <div className="relative z-0 min-h-0 min-w-0 flex-1 overflow-hidden bg-neutral-800">
            <KonvaCanvas width={size.width || 1200} height={size.height || 800} />
          </div>
        </main>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute bottom-14 left-0 top-12 w-64 overflow-y-auto border-r border-neutral-300 bg-[#f7f7f7]">
              <LayersPanel />
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-20 flex h-14 items-center justify-between border-t border-neutral-700 bg-neutral-900 px-3 text-neutral-200 md:hidden">
          <button className="rounded bg-neutral-800 px-3 py-2" onClick={() => setSidebarOpen(true)}>Capas</button>
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => openImport()}>Importar</button>
        </div>
      </div>



      <Modal open={textOpen} onClose={() => setTextOpen(false)}>
        <div className="flex flex-col gap-2">
          <input className="rounded border border-neutral-300 px-2 py-1" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Escribir texto" />
          <div className="flex justify-end gap-2">
            <button className="rounded bg-neutral-300 px-3 py-1" onClick={() => setTextOpen(false)}>Cancelar</button>
            <button className="rounded bg-blue-600 px-3 py-1 text-white" onClick={() => {
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
  )
}

function exportPNG() {
  const { layers } = useCanvasStore.getState()
  if (!layers.length) return
  const minX = Math.min(...layers.map((l) => l.x))
  const minY = Math.min(...layers.map((l) => l.y))
  const maxX = Math.max(...layers.map((l) => l.x + (l.type === 'raster' ? l.width * l.scale : 0)))
  const maxY = Math.max(...layers.map((l) => l.y + (l.type === 'raster' ? l.height * l.scale : 0)))
  const w = Math.max(1, Math.ceil(maxX - minX))
  const h = Math.max(1, Math.ceil(maxY - minY))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const queue: Promise<void>[] = []
  for (const l of layers) {
    if (l.type !== 'raster') continue
    queue.push(new Promise((resolve) => {
      const img = l.image
      if (!img) { resolve(); return }
      if (!img.complete) {
        img.onload = () => { drawLayer(ctx, img, l, minX, minY); resolve() }
        img.onerror = () => resolve()
      } else {
        drawLayer(ctx, img, l, minX, minY)
        resolve()
      }
    }))
  }
  Promise.all(queue).then(() => {
    const name = `DTF_Export_${Date.now()}.png`
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  })
}

function drawLayer(ctx: CanvasRenderingContext2D, img: HTMLImageElement, l: ReturnType<typeof useCanvasStore.getState>['layers'][number], minX: number, minY: number) {
  ctx.save()
  ctx.translate(l.x - minX, l.y - minY)
  ctx.rotate(l.rotation)
  ctx.scale(l.scale, l.scale)
  ctx.drawImage(img, 0, 0)
  ctx.restore()
}

function TopbarUndoRedo() {
  const undo = useHistoryStore((s) => s.undo)
  const redo = useHistoryStore((s) => s.redo)
  useShortcut(['Ctrl', 'Z'], undo)
  useShortcut(['Ctrl', 'Shift', 'Z'], redo)
  return (
    <div className="flex items-center gap-2">
      <button className="rounded bg-red-300 px-3 py-1" onClick={undo}>Undo</button>
      <button className="rounded bg-neutral-300 px-3 py-1" onClick={redo}>Redo</button>
    </div>
  )
}
