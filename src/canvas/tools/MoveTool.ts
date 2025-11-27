import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'
import { useHistoryStore } from '../../state/useHistoryStore'
import { MoveCommand } from '../../history/commands'

export class MoveTool implements Tool {
  type = 'move' as const
  private dragging = false
  private lastWorld = { x: 0, y: 0 }
  private startPos: { x: number; y: number } | null = null
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
    const l = useCanvasStore.getState().layers.find((x) => x.id === selectedId)
    this.startPos = l ? { x: l.x, y: l.y } : { x: 0, y: 0 }
  }
  onPointerMove(e: PointerEvent) {
    if (!this.dragging) return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    const dx = p.x - this.lastWorld.x
    const dy = p.y - this.lastWorld.y
    this.lastWorld = p
    const id = useCanvasStore.getState().selectedLayerId
    if (!id) return
    const l = useCanvasStore.getState().layers.find((x) => x.id === id)
    if (!l) return
    const previewCmd = new MoveCommand(id, { x: l.x, y: l.y }, { x: l.x + dx, y: l.y + dy })
    useHistoryStore.getState().preview(previewCmd)
  }
  onPointerUp() {
    this.dragging = false
    const id = useCanvasStore.getState().selectedLayerId
    if (!id || !this.startPos) return
    const l = useCanvasStore.getState().layers.find((x) => x.id === id)
    if (!l) return
    useHistoryStore.getState().execute(new MoveCommand(id, this.startPos, { x: l.x, y: l.y }))
  }
}
