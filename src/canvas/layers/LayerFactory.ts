import { createBaseLayer } from './LayerBase'
import type { RasterLayer, VectorLayer, TextLayer } from './layer.types'

export class LayerFactory {
  static createRaster(image: HTMLImageElement): RasterLayer {
    const base = createBaseLayer('Raster Layer', 'raster')
    return {
      ...base,
      type: 'raster',
      image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    }
  }
  static createVector(svg: string): VectorLayer {
    const base = createBaseLayer('Vector Layer', 'vector')
    return {
      ...base,
      type: 'vector',
      svg,
    }
  }
  static createText(text: string): TextLayer {
    const base = createBaseLayer('Text Layer', 'text')
    return {
      ...base,
      type: 'text',
      text,
    }
  }
}

