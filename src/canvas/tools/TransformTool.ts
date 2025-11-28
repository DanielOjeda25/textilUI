import { useCanvasStore } from '../../state/useCanvasStore'
import type { Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'
import type { AnyLayer } from '../layers/layer.types'
import { detectHandle, anchorForHandle, getBounds, rotate, HANDLE_HIT_RADIUS_SCREEN, isWithinLayer } from './handle.utils'
import type { HandleKind } from './handle.utils'
import { snapAngle, snapPoint } from '../snapping/snapping'
import { useHistoryStore } from '../../state/useHistoryStore'
import { UpdateLayerCommand, RotateCommand } from '../../history/commands'
const ROTATE_SENSITIVITY = 0.7
const SCALE_SENSITIVITY = 0.2

type Mode = 'none' | 'scale' | 'rotate' | 'move'

export class TransformTool implements Tool {
  type = 'transform' as const
  private mode: Mode = 'none'
  private startHandle: { kind: HandleKind; index?: number } = { kind: null }
  private startScale = 1
  private startRotation = 0
  private startAngle = 0
  private startX = 0
  private startY = 0
  private moveStart = { x: 0, y: 0 }
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
    let layer = this.getSelected()
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    const rect = canvas?.getBoundingClientRect()
    const sx = e.clientX - (rect?.left ?? 0)
    const sy = e.clientY - (rect?.top ?? 0)
    const p = this.viewport.screenToWorld(sx, sy)
    if (!layer) {
      const ls = useCanvasStore.getState().layers
      for (let i = ls.length - 1; i >= 0; i--) {
        const l = ls[i]
        if (!l.visible || l.locked) continue
        if (isWithinLayer(p, l)) { layer = l; useCanvasStore.getState().selectLayer(l.id); break }
      }
      if (!layer) return
    } else {
      const ls = useCanvasStore.getState().layers
      for (let i = ls.length - 1; i >= 0; i--) {
        const l = ls[i]
        if (!l.visible || l.locked) continue
        if (isWithinLayer(p, l) && l.id !== layer.id) { layer = l; useCanvasStore.getState().selectLayer(l.id); break }
      }
    }
    const vp = useCanvasStore.getState().viewport
    // Usar radio de detección configurable en píxeles de pantalla
    this.startHandle = detectHandle(p, layer, vp.scale, HANDLE_HIT_RADIUS_SCREEN)
    this.shift = e.shiftKey
    this.alt = e.altKey
    this.ctrl = e.ctrlKey || e.metaKey
    this.startScale = layer.scale
    this.startRotation = layer.rotation
    this.startX = layer.x
    this.startY = layer.y
    if (this.startHandle.kind === 'rotate') {
      this.mode = 'rotate'
      this.startAngle = Math.atan2(p.y - layer.y, p.x - layer.x)
      return
    }
    if (this.startHandle.kind === 'corner' || this.startHandle.kind === 'side') {
      const anch = this.alt ? { x: layer.x + rotate({ x: (getBounds(layer).width * layer.scale) / 2, y: (getBounds(layer).height * layer.scale) / 2 }, layer.rotation).x - rotate({ x: (getBounds(layer).width * layer.scale) / 2, y: (getBounds(layer).height * layer.scale) / 2 }, layer.rotation).x, y: layer.y } : anchorForHandle(this.startHandle.kind, this.startHandle.index, layer)
      this.anchor = anch
      this.mode = 'scale'
      return
    }
    // Mover por arrastre directo dentro del bounding box
    if (isWithinLayer(p, layer)) {
      this.mode = 'move'
      this.moveStart = { x: p.x, y: p.y }
      return
    }
  }

  onPointerMove(e: PointerEvent) {
    const layer = this.getSelected()
    if (!layer || this.mode === 'none') return
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    const rect = canvas?.getBoundingClientRect()
    const sx = e.clientX - (rect?.left ?? 0)
    const sy = e.clientY - (rect?.top ?? 0)
    const p = this.viewport.screenToWorld(sx, sy)
    const id = layer.id
    if (this.mode === 'rotate') {
      const a2 = Math.atan2(p.y - layer.y, p.x - layer.x)
      const delta = a2 - this.startAngle
      let rot = this.startRotation + delta * ROTATE_SENSITIVITY
      if (this.ctrl) rot = snapAngle(rot, 15)
      useHistoryStore.getState().preview(new RotateCommand(id, layer.rotation, rot))
      const updated = useCanvasStore.getState().layers.find((l) => l.id === id)
      if (updated) {
        const b2 = getBounds(updated)
        const vp2 = useCanvasStore.getState().viewport
        const clamped2 = clampToViewport(updated.x, updated.y, updated.scale, rot, b2, vp2)
        useHistoryStore.getState().preview(new UpdateLayerCommand(id, { x: clamped2.x, y: clamped2.y }))
      }
      return
    }
    if (this.mode === 'move') {
      const dx = p.x - this.moveStart.x
      const dy = p.y - this.moveStart.y
      const next = { x: this.startX + dx, y: this.startY + dy }
      const vp = useCanvasStore.getState().viewport
      const snapped = snapPoint(next.x, next.y, vp, 8)
      const b = getBounds(layer)
      const clamped = clampToViewport(snapped.x, snapped.y, layer.scale, layer.rotation, b, vp)
      useHistoryStore.getState().preview(new UpdateLayerCommand(id, { x: clamped.x, y: clamped.y }))
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
      const denom = Math.hypot(baseDx, baseDy) || 1
      const numer = Math.hypot(dx, dy)
      const ratio = numer / denom
      const deltaRatio = ratio - 1
      let s = this.startScale * (1 + deltaRatio * SCALE_SENSITIVITY)
      if (this.shift) {
        s = Math.max(s, 0.0001)
      }
      const startAnchorWorld = {
        x: layer.x + rotate({ x: localAnchor.x * this.startScale, y: localAnchor.y * this.startScale }, layer.rotation).x,
        y: layer.y + rotate({ x: localAnchor.x * this.startScale, y: localAnchor.y * this.startScale }, layer.rotation).y,
      }
      const nextAnchorWorld = rotate({ x: localAnchor.x * s, y: localAnchor.y * s }, layer.rotation)
      const newPos = { x: startAnchorWorld.x - nextAnchorWorld.x, y: startAnchorWorld.y - nextAnchorWorld.y }
      const vp = useCanvasStore.getState().viewport
      const snapped = snapPoint(newPos.x, newPos.y, vp, 8)
      const clamped = clampToViewport(snapped.x, snapped.y, s, layer.rotation, b, vp)
      useHistoryStore.getState().preview(new UpdateLayerCommand(id, { scale: s, x: clamped.x, y: clamped.y }))
    }
  }

  onPointerUp() {
    const mode = this.mode
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
      const b = getBounds(current)
      const vp = useCanvasStore.getState().viewport
      const clamped = clampToViewport(current.x, current.y, current.scale, current.rotation, b, vp)
      if (clamped.x !== current.x || clamped.y !== current.y) {
        useHistoryStore.getState().execute(new UpdateLayerCommand(id, { x: clamped.x, y: clamped.y }))
      }
    } else if (mode === 'move') {
      const b = getBounds(layer)
      const vp = useCanvasStore.getState().viewport
      const clamped = clampToViewport(layer.x, layer.y, layer.scale, layer.rotation, b, vp)
      useHistoryStore.getState().execute(new UpdateLayerCommand(id, { x: clamped.x, y: clamped.y }))
    } else if (this.startHandle.kind === 'corner' || this.startHandle.kind === 'side') {
      const b = getBounds(current)
      const vp = useCanvasStore.getState().viewport
      const clamped = clampToViewport(current.x, current.y, current.scale, current.rotation, b, vp)
      useHistoryStore.getState().execute(new UpdateLayerCommand(id, { scale: current.scale, x: clamped.x, y: clamped.y }))
    }
  }

  onCancel() {
    const layer = this.getSelected()
    if (!layer) return
    const id = layer.id
    useHistoryStore.getState().preview(new UpdateLayerCommand(id, { x: this.startX, y: this.startY, scale: this.startScale, rotation: this.startRotation }))
    this.mode = 'none'
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

function cornersFor(x: number, y: number, scale: number, rotation: number, bounds: { width: number; height: number }): { x: number; y: number }[] {
  const pts = [
    { x: 0, y: 0 },
    { x: bounds.width, y: 0 },
    { x: bounds.width, y: bounds.height },
    { x: 0, y: bounds.height },
  ]
  return pts.map((p) => {
    const rp = rotate({ x: p.x * scale, y: p.y * scale }, rotation)
    return { x: rp.x + x, y: rp.y + y }
  })
}

function clampToViewport(x: number, y: number, scale: number, rotation: number, bounds: { width: number; height: number }, vp: { x: number; y: number; scale: number; screenWidth: number; screenHeight: number }): { x: number; y: number } {
  const viewMinX = (0 - vp.x) / vp.scale
  const viewMinY = (0 - vp.y) / vp.scale
  const viewMaxX = (vp.screenWidth - vp.x) / vp.scale
  const viewMaxY = (vp.screenHeight - vp.y) / vp.scale
  const cs = cornersFor(x, y, scale, rotation, bounds)
  let minX = cs[0].x, maxX = cs[0].x, minY = cs[0].y, maxY = cs[0].y
  for (let i = 1; i < cs.length; i++) {
    minX = Math.min(minX, cs[i].x)
    maxX = Math.max(maxX, cs[i].x)
    minY = Math.min(minY, cs[i].y)
    maxY = Math.max(maxY, cs[i].y)
  }
  let dx = 0
  let dy = 0
  if (minX < viewMinX) dx += viewMinX - minX
  if (maxX + dx > viewMaxX) dx += viewMaxX - (maxX + dx)
  if (minY < viewMinY) dy += viewMinY - minY
  if (maxY + dy > viewMaxY) dy += viewMaxY - (maxY + dy)
  return { x: x + dx, y: y + dy }
}
