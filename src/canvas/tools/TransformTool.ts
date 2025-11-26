import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'

type Mode = 'none' | 'scale' | 'rotate'

export class TransformTool implements Tool {
  type = 'transform' as const
  private mode: Mode = 'none'
  private origin = { x: 0, y: 0 }
  private startVector = { x: 0, y: 0 }
  private startScale = 1
  private startRotation = 0
  private viewport: ViewportController
  constructor(viewport: ViewportController) {
    this.viewport = viewport
  }

  private getSelected() {
    const id = useCanvasStore.getState().selectedLayerId
    return id ? useCanvasStore.getState().layers.find((l) => l.id === id) : undefined
  }

  onPointerDown(e: PointerEvent) {
    const layer = this.getSelected()
    if (!layer) return
    const center = { x: layer.x + (layer.type === 'raster' ? (layer.width * layer.scale) / 2 : 50 * layer.scale), y: layer.y + (layer.type === 'raster' ? (layer.height * layer.scale) / 2 : 50 * layer.scale) }
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    this.origin = center
    const v = { x: p.x - center.x, y: p.y - center.y }
    this.startVector = v
    this.startScale = layer.scale
    this.startRotation = layer.rotation
    const vpScale = useCanvasStore.getState().viewport.scale
    const handleRadius = 12 / vpScale
    const rotHandle = { x: center.x, y: center.y - ((layer.type === 'raster' ? layer.height : 100) * layer.scale) / 2 - 30 / vpScale }
    const distRot = Math.hypot(p.x - rotHandle.x, p.y - rotHandle.y)
    if (distRot <= handleRadius) {
      this.mode = 'rotate'
      return
    }
    // Corners scale
    this.mode = 'scale'
  }

  onPointerMove(e: PointerEvent) {
    const layer = this.getSelected()
    if (!layer || this.mode === 'none') return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    const v = { x: p.x - this.origin.x, y: p.y - this.origin.y }
    const id = layer.id
    if (this.mode === 'rotate') {
      const a1 = Math.atan2(this.startVector.y, this.startVector.x)
      const a2 = Math.atan2(v.y, v.x)
      const rot = this.startRotation + (a2 - a1)
      useCanvasStore.getState().updateLayer(id, { rotation: rot })
    } else if (this.mode === 'scale') {
      const d1 = Math.hypot(this.startVector.x, this.startVector.y)
      const d2 = Math.hypot(v.x, v.y)
      const s = d2 / (d1 || 1)
      useCanvasStore.getState().updateLayer(id, { scale: this.startScale * s })
    }
  }

  onPointerUp() {
    this.mode = 'none'
  }
}
