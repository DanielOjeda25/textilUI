export type ToolType = 'select' | 'move' | 'transform' | 'crop' | 'eraser' | 'magic' | 'color' | 'text'

export interface Tool {
  type: ToolType
  onPointerDown?(e: PointerEvent, hit: boolean): void
  onPointerMove?(e: PointerEvent): void
  onPointerUp?(e: PointerEvent): void
  onCancel?(): void
  activate?(): void
  deactivate?(): void
}
