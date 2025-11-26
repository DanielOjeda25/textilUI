import { useCanvasStore } from '../../state/useCanvasStore'
import { useToolStore } from '../../state/useToolStore'
import type { AnyLayer } from '../layers/layer.types'
import type { Tool, ToolType } from './tool.types'
import { SelectionTool } from './SelectionTool'
import { MoveTool } from './MoveTool'
import { TransformTool } from './TransformTool'
import { ViewportController } from '../viewport/ViewportController'

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
      let w = 0
      let h = 0
      if (l.type === 'raster') {
        w = l.width
        h = l.height
      } else if (l.type === 'vector') {
        // Approximate using 100x100 if size unknown; can be refined later
        w = 100
        h = 100
      } else if (l.type === 'text') {
        w = 100
        h = 40
      }
      if (tx >= 0 && ty >= 0 && tx <= w && ty <= h) {
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
  }
  onPointerUp = (e: PointerEvent) => {
    this.active.onPointerUp?.(e)
  }
}

