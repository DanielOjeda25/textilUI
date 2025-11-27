import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'
import type { AnyLayer } from '../layers/layer.types'
import { detectHandle, anchorForHandle, getBounds, rotate } from './handle.utils'
import type { HandleKind } from './handle.utils'
import { snapAngle, snapPoint } from '../snapping/snapping'
import { useHistoryStore } from '../../state/useHistoryStore'
import { UpdateLayerCommand, RotateCommand } from '../../history/commands'

type Mode = 'none' | 'scale' | 'rotate'

export class TransformTool implements Tool {
  type = 'transform' as const
  private mode: Mode = 'none'
  private origin = { x: 0, y: 0 }
  private startHandle: { kind: HandleKind; index?: number } = { kind: null }
  private startScale = 1
  private startRotation = 0
  private anchor = { x: 0, y: 0 }
  private shift = false
  private alt = false
  private ctrl = false
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
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    const vp = useCanvasStore.getState().viewport
    this.startHandle = detectHandle(p, layer, vp.scale, 10)
    this.shift = e.shiftKey
    this.alt = e.altKey
    this.ctrl = e.ctrlKey || e.metaKey
    this.startScale = layer.scale
    this.startRotation = layer.rotation
    if (this.startHandle.kind === 'rotate') {
      this.mode = 'rotate'
      this.origin = { x: layer.x + rotate({ x: (getBounds(layer).width * layer.scale) / 2, y: (getBounds(layer).height * layer.scale) / 2 }, layer.rotation).x - rotate({ x: (getBounds(layer).width * layer.scale) / 2, y: (getBounds(layer).height * layer.scale) / 2 }, layer.rotation).x, y: layer.y }
      return
    }
    if (this.startHandle.kind === 'corner' || this.startHandle.kind === 'side') {
      const anch = this.alt ? { x: layer.x + rotate({ x: (getBounds(layer).width * layer.scale) / 2, y: (getBounds(layer).height * layer.scale) / 2 }, layer.rotation).x - rotate({ x: (getBounds(layer).width * layer.scale) / 2, y: (getBounds(layer).height * layer.scale) / 2 }, layer.rotation).x, y: layer.y } : anchorForHandle(this.startHandle.kind, this.startHandle.index, layer)
      this.anchor = anch
      this.mode = 'scale'
      return
    }
  }

  onPointerMove(e: PointerEvent) {
    const layer = this.getSelected()
    if (!layer || this.mode === 'none') return
    const p = this.viewport.screenToWorld(e.clientX, e.clientY)
    const id = layer.id
    if (this.mode === 'rotate') {
      const a1 = Math.atan2(this.origin.y - layer.y, this.origin.x - layer.x)
      const a2 = Math.atan2(p.y - layer.y, p.x - layer.x)
      let rot = this.startRotation + (a2 - a1)
      if (this.ctrl) rot = snapAngle(rot, 15)
      useHistoryStore.getState().preview(new RotateCommand(id, layer.rotation, rot))
      return
    }
    if (this.mode === 'scale') {
      const b = getBounds(layer)
      const localAnchor = worldToLocal(this.anchor, layer)
      const localPointer = worldToLocal(p, layer)
      const dx = localPointer.x - localAnchor.x
      const dy = localPointer.y - localAnchor.y
      const baseDx = (b.width * this.startScale) * 0.5
      const baseDy = (b.height * this.startScale) * 0.5
      let s = this.startScale
      const denom = Math.hypot(baseDx, baseDy) || 1
      const numer = Math.hypot(dx, dy)
      s = this.startScale * (numer / denom)
      if (this.shift) {
        s = Math.max(s, 0.0001)
      }
      const newPos = solveTranslationForAnchor(localAnchor, layer.rotation, s)
      const vp = useCanvasStore.getState().viewport
      const snapped = snapPoint(newPos.x, newPos.y, vp, 8)
      useHistoryStore.getState().preview(new UpdateLayerCommand(id, { scale: s, x: snapped.x, y: snapped.y }))
    }
  }

  onPointerUp() {
    this.mode = 'none'
    const layer = this.getSelected()
    if (!layer) return
    const id = layer.id
    // For rotate: commit rotation change
    // For scale: commit last previewed scale/position against start values
    // We'll read current values and push a command from startScale/startRotation and original anchor-based position
    const current = useCanvasStore.getState().layers.find((l) => l.id === id)
    if (!current) return
    if (this.startHandle.kind === 'rotate') {
      useHistoryStore.getState().execute(new RotateCommand(id, this.startRotation, current.rotation))
    } else if (this.startHandle.kind === 'corner' || this.startHandle.kind === 'side') {
      useHistoryStore.getState().execute(new UpdateLayerCommand(id, { scale: current.scale, x: current.x, y: current.y }))
    }
  }
}

function worldToLocal(p: { x: number; y: number }, layer: AnyLayer): { x: number; y: number } {
  const lx = p.x - layer.x
  const ly = p.y - layer.y
  const c = Math.cos(-layer.rotation)
  const s = Math.sin(-layer.rotation)
  const rx = c * lx - s * ly
  const ry = s * lx + c * ly
  return { x: rx / layer.scale, y: ry / layer.scale }
}

function solveTranslationForAnchor(localAnchor: { x: number; y: number }, rotation: number, scale: number): { x: number; y: number } {
  const rp = rotate({ x: localAnchor.x * scale, y: localAnchor.y * scale }, rotation)
  return { x: -rp.x, y: -rp.y }
}
