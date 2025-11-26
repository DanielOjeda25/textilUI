export type ToolType = 'select' | 'move' | 'transform' | 'text'

export interface Tool {
  type: ToolType
  onPointerDown?(e: PointerEvent, hit: boolean): void
  onPointerMove?(e: PointerEvent): void
  onPointerUp?(e: PointerEvent): void
  activate?(): void
  deactivate?(): void
}

