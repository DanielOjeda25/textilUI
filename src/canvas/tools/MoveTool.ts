import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'
import { useHistoryStore } from '../../state/useHistoryStore'
import { MoveCommand } from '../../history/commands'
import { snapPoint } from '../snapping/snapping'

export class MoveTool implements Tool {
  type = 'move' as const
  private dragging = false
  private lastWorld = { x: 0, y: 0 }
  private startPos: { x: number; y: number } | null = null
  private snap = false
  private viewport: ViewportController
  constructor(viewport: ViewportController) {
    this.viewport = viewport
  }

  onPointerDown(e: PointerEvent) {
    const selectedId = useCanvasStore.getState().selectedLayerId
    if (!selectedId) return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    this.dragging = true
    this.snap = e.ctrlKey || e.metaKey
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
    let nx = l.x + dx
    let ny = l.y + dy
    if (this.snap) {
      const vp = useCanvasStore.getState().viewport
      const s = snapPoint(nx, ny, vp, 8)
      nx = s.x
      ny = s.y
    }
    const previewCmd = new MoveCommand(id, { x: l.x, y: l.y }, { x: nx, y: ny })
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
