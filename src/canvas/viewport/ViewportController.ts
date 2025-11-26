import { useCanvasStore } from '../../state/useCanvasStore'
import type { ViewportState } from './viewport.types'

export type Point = { x: number; y: number }

export interface ViewportControllerOptions {
  limits?: boolean
}

export class ViewportController {
  private options: ViewportControllerOptions
  constructor(options: ViewportControllerOptions = {}) {
    this.options = options
  }

  private get v(): ViewportState {
    return useCanvasStore.getState().viewport
  }

  private setViewport(next: Partial<ViewportState>) {
    const current = this.v
    useCanvasStore.setState({ viewport: { ...current, ...next } })
  }

  setPosition(x: number, y: number) {
    const p = this.applyLimitsToPosition({ x, y }, this.v.scale)
    this.setViewport({ x: p.x, y: p.y })
  }

  panBy(dx: number, dy: number) {
    this.setPosition(this.v.x + dx, this.v.y + dy)
  }

  setScale(scale: number, cx?: number, cy?: number) {
    const s = this.clampScale(scale)
    if (cx !== undefined && cy !== undefined) {
      const localX = (cx - this.v.x) / this.v.scale
      const localY = (cy - this.v.y) / this.v.scale
      const nx = cx - localX * s
      const ny = cy - localY * s
      const p = this.applyLimitsToPosition({ x: nx, y: ny }, s)
      this.setViewport({ scale: s, x: p.x, y: p.y })
    } else {
      this.setViewport({ scale: s })
    }
  }

  zoomAt(deltaY: number, cx: number, cy: number) {
    const factor = Math.pow(1.2, -deltaY / 100)
    this.setScale(this.v.scale * factor, cx, cy)
  }

  fitToScreen() {
    const { screenWidth, screenHeight, contentWidth, contentHeight } = this.v
    if (screenWidth <= 0 || screenHeight <= 0 || contentWidth <= 0 || contentHeight <= 0) return
    const s = Math.min(screenWidth / contentWidth, screenHeight / contentHeight)
    const scale = this.clampScale(s)
    const x = (screenWidth - contentWidth * scale) / 2
    const y = (screenHeight - contentHeight * scale) / 2
    const p = this.applyLimitsToPosition({ x, y }, scale)
    this.setViewport({ scale, x: p.x, y: p.y })
  }

  resetView() {
    this.setViewport({ scale: 1, x: 0, y: 0 })
  }

  setScreenSize(width: number, height: number) {
    this.setViewport({ screenWidth: width, screenHeight: height })
  }

  setContentSize(width: number, height: number) {
    this.setViewport({ contentWidth: width, contentHeight: height })
  }

  clampScale(scale: number): number {
    const { minScale, maxScale } = this.v
    return Math.min(maxScale, Math.max(minScale, scale))
  }

  applyLimitsToPosition(pos: Point, scale: number): Point {
    if (!this.options.limits) return pos
    const { screenWidth, screenHeight, contentWidth, contentHeight } = this.v
    const minX = screenWidth - contentWidth * scale
    const minY = screenHeight - contentHeight * scale
    const maxX = 0
    const maxY = 0
    const x = Math.min(maxX, Math.max(minX, pos.x))
    const y = Math.min(maxY, Math.max(minY, pos.y))
    return { x, y }
  }

  screenToWorld(sx: number, sy: number): Point {
    return { x: (sx - this.v.x) / this.v.scale, y: (sy - this.v.y) / this.v.scale }
  }

  worldToScreen(wx: number, wy: number): Point {
    return { x: wx * this.v.scale + this.v.x, y: wy * this.v.scale + this.v.y }
  }
}

