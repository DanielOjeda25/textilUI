import type { ToolType, Tool } from './tool.types'
import { ViewportController } from '../viewport/ViewportController'
import { useToolStore } from '../../state/useToolStore'
// import { SelectionTool } from './SelectionTool'
// import { MoveTool } from './MoveTool'
import { TransformTool } from './TransformTool'

class EmptyTool implements Tool {
  type: ToolType
  constructor(id: ToolType) { this.type = id }
  onPointerDown?(e: PointerEvent): void
  onPointerMove?(e: PointerEvent): void
  onPointerUp?(e: PointerEvent): void
}

export class ToolController {
  private viewport: ViewportController
  private active: Tool
  private registry: Map<ToolType, () => Tool>
  constructor(viewport: ViewportController) {
    this.viewport = viewport
    this.registry = new Map<ToolType, () => Tool>([
      ['select', () => new TransformTool(this.viewport)],
      ['move', () => new TransformTool(this.viewport)],
      ['transform', () => new TransformTool(this.viewport)],
      ['crop', () => new EmptyTool('crop')],
      ['eraser', () => new EmptyTool('eraser')],
      ['magic', () => new EmptyTool('magic')],
      ['color', () => new EmptyTool('color')],
      ['text', () => new EmptyTool('text')],
    ])
    this.active = this.registry.get(useToolStore.getState().activeTool)?.() ?? new TransformTool(this.viewport)
  }
  private ensureActive() {
    const id = useToolStore.getState().activeTool
    const current = this.active?.type
    if (current === id && this.active) return
    const factory = this.registry.get(id) ?? this.registry.get('select')!
    this.active = factory()
  }
  onPointerDown(e: PointerEvent) {
    this.ensureActive()
    this.active.onPointerDown?.(e, true)
  }
  onPointerMove(e: PointerEvent) {
    this.ensureActive()
    this.active.onPointerMove?.(e)
  }
  onPointerUp(e: PointerEvent) {
    this.ensureActive()
    this.active.onPointerUp?.(e)
  }
  cancel() {
    this.ensureActive()
    this.active.onCancel?.()
  }
}
