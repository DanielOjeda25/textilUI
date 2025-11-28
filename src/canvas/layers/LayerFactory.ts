import { createBaseLayer } from './LayerBase'
import type { RasterLayer, VectorLayer, TextLayer } from './layer.types'
import { useCanvasStore } from '../../state/useCanvasStore'

export class LayerFactory {
  static createRaster(image: HTMLImageElement, opts?: { fileBuffer?: ArrayBuffer; alphaMaxSize?: number }): RasterLayer {
    const base = createBaseLayer('Raster Layer', 'raster')
    const layer: RasterLayer = {
      ...base,
      type: 'raster',
      image,
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      originalWidth: image.naturalWidth || image.width,
      originalHeight: image.naturalHeight || image.height,
    }
    if (opts?.fileBuffer) {
      try {
        const worker = new Worker(new URL('../../workers/alphaMap.worker.ts', import.meta.url), { type: 'module' })
        worker.onmessage = (ev: MessageEvent<{ layerId: string; w: number; h: number; alphaBuffer: Uint8Array }>) => {
          const { layerId, w, h, alphaBuffer } = ev.data
          useCanvasStore.getState().setAlphaMap(layerId, { w, h, data: alphaBuffer })
          worker.terminate()
        }
        worker.postMessage({ layerId: layer.id, imageArrayBuffer: opts.fileBuffer, maxSize: opts.alphaMaxSize ?? 256 }, [opts.fileBuffer])
      } catch { void 0 }
    }
    return layer
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
