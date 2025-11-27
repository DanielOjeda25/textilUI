import { importFile } from '../pipelines/import/importFile'
import { useCanvasStore } from '../state/useCanvasStore'
import { useHistoryStore } from '../state/useHistoryStore'
import { AddLayerCommand } from '../history/commands'
import type { AnyLayer } from '../canvas/layers/layer.types'

function centerWorldFromViewport() {
  const v = useCanvasStore.getState().viewport
  const sx = v.screenWidth / 2
  const sy = v.screenHeight / 2
  const wx = (sx - v.x) / v.scale
  const wy = (sy - v.y) / v.scale
  return { wx, wy }
}

function fitScaleForLayer(layer: AnyLayer): number {
  const v = useCanvasStore.getState().viewport
  const maxW = v.screenWidth * 0.8
  const maxH = v.screenHeight * 0.8
  let lw = 100
  let lh = 100
  if (layer.type === 'raster') { lw = layer.width; lh = layer.height }
  else if (layer.type === 'text') { lw = 200; lh = 40 }
  else if (layer.type === 'vector') { lw = 200; lh = 200 }
  const s = Math.min(maxW / lw, maxH / lh)
  return isFinite(s) && s > 0 ? s : 1
}

export async function createLayerFromFile(files: File[]) {
  for (const f of files) {
    const layers = await importFile(f)
    for (const layer of layers) {
      const { wx, wy } = centerWorldFromViewport()
      const s = fitScaleForLayer(layer)
      const next = { ...layer, x: wx - (layer.type === 'raster' ? (layer.width * s) / 2 : 100 * s / 2), y: wy - (layer.type === 'raster' ? (layer.height * s) / 2 : 100 * s / 2), scale: s, name: f.name }
      useHistoryStore.getState().execute(new AddLayerCommand(next))
      useCanvasStore.getState().selectLayer(next.id)
    }
  }
}
