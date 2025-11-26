import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'

export class SelectionTool implements Tool {
  type = 'select' as const
  private viewport: ViewportController
  constructor(viewport: ViewportController) {
    this.viewport = viewport
  }
  onPointerDown(e: PointerEvent, hit: boolean) {
    if (!hit) return
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
      if (l.type === 'raster') { w = l.width; h = l.height }
      else if (l.type === 'vector') { w = 100; h = 100 }
      else if (l.type === 'text') { w = 100; h = 40 }
      if (tx >= 0 && ty >= 0 && tx <= w && ty <= h) {
        useCanvasStore.getState().selectLayer(l.id)
        return
      }
    }
  }
}
