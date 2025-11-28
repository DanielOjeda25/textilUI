export type LayerType = 'raster' | 'vector' | 'text' | 'group'

export interface BaseLayer {
    id: string
    type: LayerType
    name: string
    visible: boolean
    locked: boolean
    x: number
    y: number
    scale: number
    rotation: number
    selected: boolean
    originalX?: number
    originalY?: number
    originalRotation?: number
    originalScale?: number
}

export interface RasterLayer extends BaseLayer {
    type: 'raster'
    image: HTMLImageElement
    width: number
    height: number
    alphaMap?: { w: number; h: number; data: Uint8Array }
    originalWidth?: number
    originalHeight?: number
}

export interface VectorLayer extends BaseLayer {
    type: 'vector'
    svg: string
}

export interface TextLayer extends BaseLayer {
    type: 'text'
    text: string
}

export type AnyLayer = RasterLayer | VectorLayer | TextLayer

