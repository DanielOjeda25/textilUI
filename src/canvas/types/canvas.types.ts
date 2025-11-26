export type LayerId = string
export type LayerType = 'image' | 'vector' | 'grid'

export interface Layer {
  id: LayerId
  type: LayerType
  visible: boolean
}

export interface CanvasState {
  layers: Layer[]
  viewport: { x: number; y: number; scale: number }
}
