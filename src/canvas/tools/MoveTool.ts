import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'

export class MoveTool implements Tool {
  type = 'move' as const
  private dragging = false
  private lastWorld = { x: 0, y: 0 }
  private viewport: ViewportController
  constructor(viewport: ViewportController) {
    this.viewport = viewport
  }

  onPointerDown(e: PointerEvent) {
    const selectedId = useCanvasStore.getState().selectedLayerId
    if (!selectedId) return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    this.dragging = true
    this.lastWorld = p
  }
  onPointerMove(e: PointerEvent) {
    if (!this.dragging) return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    const dx = p.x - this.lastWorld.x
    const dy = p.y - this.lastWorld.y
    this.lastWorld = p
    const id = useCanvasStore.getState().selectedLayerId
    if (!id) return
    useCanvasStore.getState().updateLayer(id, { x: (useCanvasStore.getState().layers.find(l => l.id === id)?.x ?? 0) + dx, y: (useCanvasStore.getState().layers.find(l => l.id === id)?.y ?? 0) + dy })
  }
  onPointerUp() {
    this.dragging = false
  }
}
