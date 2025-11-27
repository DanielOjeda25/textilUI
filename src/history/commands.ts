import { useCanvasStore } from '../state/useCanvasStore'
import type { AnyLayer } from '../canvas/layers/layer.types'

export interface Command {
    do(): void
    undo(): void
}

function getLayer(id: string): AnyLayer | undefined {
    return useCanvasStore.getState().layers.find((l) => l.id === id)
}

export class AddLayerCommand implements Command {
  private layer: AnyLayer
  constructor(layer: AnyLayer) { this.layer = layer }
  do() { useCanvasStore.getState().addLayer(this.layer) }
  undo() { useCanvasStore.getState().removeLayer(this.layer.id) }
}

export class RemoveLayerCommand implements Command {
  private removed?: AnyLayer
  private id: string
  constructor(id: string) { this.id = id }
  do() {
    const l = getLayer(this.id)
    this.removed = l ? { ...l } : undefined
    useCanvasStore.getState().removeLayer(this.id)
  }
  undo() { if (this.removed) useCanvasStore.getState().addLayer(this.removed) }
}

export class UpdateLayerCommand<T extends Partial<AnyLayer>> implements Command {
  private prev?: Partial<AnyLayer>
  private id: string
  private next: T
  constructor(id: string, next: T) { this.id = id; this.next = next }
  do() {
    const l = getLayer(this.id)
    if (!l) return
    const prev: Partial<AnyLayer> = {}
    for (const k of Object.keys(this.next) as (keyof AnyLayer)[]) {
      // @ts-expect-error index access
      prev[k] = l[k]
    }
    this.prev = prev
    useCanvasStore.getState().updateLayer(this.id, this.next)
  }
  undo() { if (this.prev) useCanvasStore.getState().updateLayer(this.id, this.prev) }
}

export class MoveCommand implements Command {
  private id: string
  private from: { x: number; y: number }
  private to: { x: number; y: number }
  constructor(id: string, from: { x: number; y: number }, to: { x: number; y: number }) { this.id = id; this.from = from; this.to = to }
  do() { useCanvasStore.getState().updateLayer(this.id, { x: this.to.x, y: this.to.y }) }
  undo() { useCanvasStore.getState().updateLayer(this.id, { x: this.from.x, y: this.from.y }) }
}

export class ScaleCommand implements Command {
  private id: string
  private from: number
  private to: number
  constructor(id: string, from: number, to: number) { this.id = id; this.from = from; this.to = to }
  do() { useCanvasStore.getState().updateLayer(this.id, { scale: this.to }) }
  undo() { useCanvasStore.getState().updateLayer(this.id, { scale: this.from }) }
}

export class RotateCommand implements Command {
  private id: string
  private from: number
  private to: number
  constructor(id: string, from: number, to: number) { this.id = id; this.from = from; this.to = to }
  do() { useCanvasStore.getState().updateLayer(this.id, { rotation: this.to }) }
  undo() { useCanvasStore.getState().updateLayer(this.id, { rotation: this.from }) }
}

