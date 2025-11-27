import { useEffect, useState } from 'react'
import type { Container, FederatedPointerEvent } from 'pixi.js'
import { useToolStore } from '../../state/useToolStore'
import { useCanvasStore } from '../../state/useCanvasStore'
import { ViewportController } from '../viewport/ViewportController'
import { getBounds } from './handle.utils'

export type ToolId = 'select' | 'move' | 'transform' | 'crop' | 'eraser' | 'magic' | 'color' | 'text'

export type ToolContext = { stage: Container; viewport: ViewportController }

export interface ITool {
  id: ToolId
  activate(ctx: ToolContext): void
  deactivate(): void
  onPointerDown(e: FederatedPointerEvent): void
  onPointerMove(e: FederatedPointerEvent): void
  onPointerUp(e: FederatedPointerEvent): void
}

class EmptyTool implements ITool {
  id: ToolId
  constructor(id: ToolId) { this.id = id }
  activate(ctx: ToolContext) { void ctx }
  deactivate() { }
  onPointerDown(e: FederatedPointerEvent) { void e }
  onPointerMove(e: FederatedPointerEvent) { void e }
  onPointerUp(e: FederatedPointerEvent) { void e }
}

export class SelectTool implements ITool {
  id: ToolId = 'select'
  private ctx: ToolContext | null = null
  activate(ctx: ToolContext) { this.ctx = ctx }
  deactivate() { this.ctx = null }
  onPointerDown(e: FederatedPointerEvent) {
    if (!this.ctx) return
    const sx = e.global.x
    const sy = e.global.y
    const p = this.ctx.viewport.screenToWorld(sx, sy)
    const layers = useCanvasStore.getState().layers
    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i]
      if (!l.visible) continue
      const s = l.scale
      const c = Math.cos(l.rotation)
      const sn = Math.sin(l.rotation)
      const lx = p.x - l.x
      const ly = p.y - l.y
      const rx = c * lx + sn * ly
      const ry = -sn * lx + c * ly
      const tx = rx / s
      const ty = ry / s
      const { width, height } = getBounds(l)
      if (tx >= 0 && ty >= 0 && tx <= width && ty <= height) {
        useCanvasStore.getState().selectLayer(l.id)
        return
      }
    }
  }
  onPointerMove(e: FederatedPointerEvent) { void e }
  onPointerUp(e: FederatedPointerEvent) { void e }
}

export class ToolController {
  private ctx: ToolContext
  private active: ITool
  private registry: Map<ToolId, () => ITool>
  constructor(ctx: ToolContext) {
    this.ctx = ctx
    this.registry = new Map<ToolId, () => ITool>([
      ['select', () => new SelectTool()],
      ['move', () => new EmptyTool('move')],
      ['transform', () => new EmptyTool('transform')],
      ['crop', () => new EmptyTool('crop')],
      ['eraser', () => new EmptyTool('eraser')],
      ['magic', () => new EmptyTool('magic')],
      ['color', () => new EmptyTool('color')],
      ['text', () => new EmptyTool('text')],
    ])
    this.active = new SelectTool()
    this.active.activate(this.ctx)
  }
  setTool(id: ToolId) {
    if (this.active) this.active.deactivate()
    const factory = this.registry.get(id) ?? this.registry.get('select')!
    this.active = factory()
    this.active.activate(this.ctx)
  }
  attach() {
    const s = this.ctx.stage
    s.on('pointerdown', this.onPointerDown)
    s.on('pointermove', this.onPointerMove)
    s.on('pointerup', this.onPointerUp)
  }
  detach() {
    const s = this.ctx.stage
    s.off('pointerdown', this.onPointerDown)
    s.off('pointermove', this.onPointerMove)
    s.off('pointerup', this.onPointerUp)
  }
  private onPointerDown = (e: FederatedPointerEvent) => { this.active.onPointerDown(e) }
  private onPointerMove = (e: FederatedPointerEvent) => { this.active.onPointerMove(e) }
  private onPointerUp = (e: FederatedPointerEvent) => { this.active.onPointerUp(e) }
}

export function useToolController(canvasRef: React.MutableRefObject<{ stage: Container; viewport: ViewportController } | null>) {
  const active = useToolStore((s) => s.activeTool as ToolId)
  const [controller, setController] = useState<ToolController | null>(null)
  useEffect(() => {
    if (controller) return
    const c = canvasRef.current
    if (!c) return
    const ctl = new ToolController({ stage: c.stage, viewport: c.viewport })
    setController(ctl)
  }, [canvasRef, controller])
  useEffect(() => {
    if (!controller) return
    controller.attach()
    return () => controller.detach()
  }, [controller])
  useEffect(() => {
    if (!controller) return
    controller.setTool(active)
  }, [active, controller])
  return controller
}
