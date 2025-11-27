import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'
import type { AnyLayer } from '../layers/layer.types'
import { getBounds } from './handle.utils'

export class SelectionTool implements Tool {
  type = 'select' as const
  private viewport: ViewportController
  private rasterCache = new Map<string, HTMLCanvasElement>()
  constructor(viewport: ViewportController) {
    this.viewport = viewport
  }
  private withinLayer(l: AnyLayer, wx: number, wy: number): boolean {
    const s = l.scale
    const cos = Math.cos(l.rotation)
    const sin = Math.sin(l.rotation)
    const lx = wx - l.x
    const ly = wy - l.y
    const rx = cos * lx + sin * ly
    const ry = -sin * lx + cos * ly
    const tx = rx / s
    const ty = ry / s
    const { width, height } = getBounds(l)
    if (tx < 0 || ty < 0 || tx > width || ty > height) return false
    if (l.type === 'raster') {
      if (l.alphaMap) {
        const ax = Math.floor((tx / l.width) * l.alphaMap.w)
        const ay = Math.floor((ty / l.height) * l.alphaMap.h)
        if (ax < 0 || ay < 0 || ax >= l.alphaMap.w || ay >= l.alphaMap.h) return false
        const idx = ay * l.alphaMap.w + ax
        if (l.alphaMap.data[idx] === 0) return false
      } else {
        const key = l.id
        let canvas = this.rasterCache.get(key)
        if (!canvas) {
          canvas = document.createElement('canvas')
          canvas.width = l.width
          canvas.height = l.height
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
          ctx.drawImage(l.image, 0, 0)
          this.rasterCache.set(key, canvas)
        }
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        const px = Math.floor(tx)
        const py = Math.floor(ty)
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return false
        const data = ctx.getImageData(px, py, 1, 1).data
        if (data[3] === 0) return false
      }
    }
    return true
  }
  onPointerDown(e: PointerEvent, hit: boolean) {
    if (!hit) return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    const layers = useCanvasStore.getState().layers
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      if (!l.visible) continue
      if (this.withinLayer(l, p.x, p.y)) {
        useCanvasStore.getState().selectLayer(l.id)
        return
      }
    }
  }
}
