import type { BaseLayer, LayerType } from './layer.types'

export function createBaseLayer(name: string, type: LayerType): BaseLayer {
  const id = crypto.randomUUID()
  return {
    id,
    type,
    name,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    selected: false,
    originalX: 0,
    originalY: 0,
    originalRotation: 0,
  }
}
