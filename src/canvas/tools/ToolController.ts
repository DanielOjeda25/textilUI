import { useCanvasStore } from '../../state/useCanvasStore'
import { useToolStore } from '../../state/useToolStore'
import type { AnyLayer } from '../layers/layer.types'
import type { Tool, ToolType } from './tool.types'
import { SelectionTool } from './SelectionTool'
import { MoveTool } from './MoveTool'
import { TransformTool } from './TransformTool'
import { ViewportController } from '../viewport/ViewportController'
import { getBounds } from './handle.utils'
import { snapPoint } from '../snapping/snapping'

export class ToolController {
  private active: Tool
  private viewport: ViewportController

  constructor(viewport: ViewportController) {
    this.viewport = viewport
    this.active = new SelectionTool(this.viewport)
    useToolStore.subscribe((state, prev) => {
      if (state.activeTool !== prev.activeTool) this.setTool(state.activeTool)
    })
  }

  private setTool(type: ToolType) {
    if (this.active?.deactivate) this.active.deactivate()
    if (type === 'select') this.active = new SelectionTool(this.viewport)
    else if (type === 'move') this.active = new MoveTool(this.viewport)
    else if (type === 'transform') this.active = new TransformTool(this.viewport)
    else this.active = new SelectionTool(this.viewport)
    if (this.active.activate) this.active.activate()
  }

  private hitTest(e: PointerEvent): { hit: boolean; layer?: AnyLayer } {
    const { x, y } = this.viewport.screenToWorld(e.clientX, e.clientY)
    const layers = useCanvasStore.getState().layers
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      if (!l.visible) continue
      const s = l.scale
      const cos = Math.cos(l.rotation)
      const sin = Math.sin(l.rotation)
      const lx = x - l.x
      const ly = y - l.y
      const rx = cos * lx + sin * ly
      const ry = -sin * lx + cos * ly
      const tx = rx / s
      const ty = ry / s
      const { width, height } = getBounds(l)
      if (tx >= 0 && ty >= 0 && tx <= width && ty <= height) {
        return { hit: true, layer: l }
      }
    }
    return { hit: false }
  }

  onPointerDown = (e: PointerEvent) => {
    const res = this.hitTest(e)
    this.active.onPointerDown?.(e, res.hit)
  }
  onPointerMove = (e: PointerEvent) => {
    this.active.onPointerMove?.(e)
    const activeType = this.active.type
    if (activeType === 'move') {
      const id = useCanvasStore.getState().selectedLayerId
      if (!id) return
      const layer = useCanvasStore.getState().layers.find((l) => l.id === id)
      if (!layer) return
      const vp = useCanvasStore.getState().viewport
      const snapped = snapPoint(layer.x, layer.y, vp, 8)
      if (snapped.x !== layer.x || snapped.y !== layer.y) useCanvasStore.getState().updateLayer(id, { x: snapped.x, y: snapped.y })
    }
  }
  onPointerUp = (e: PointerEvent) => {
    this.active.onPointerUp?.(e)
  }
}
