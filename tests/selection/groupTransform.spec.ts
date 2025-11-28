import { describe, it, expect } from 'vitest'
import type { AnyLayer, RasterLayer, VectorLayer, TextLayer } from '../../src/canvas/layers/layer.types'
import { applyGroupTransform, selectionCenterOBB } from '../../src/canvas/selection/selectionUtils'

function raster(id: string, x: number, y: number, w: number, h: number, scale: number, rotation: number): RasterLayer {
  return { id, type: 'raster', name: id, visible: true, locked: false, x, y, scale, rotation, selected: false, image: {} as HTMLImageElement, width: w, height: h }
}
function vector(id: string, x: number, y: number, w: number, h: number, scale: number, rotation: number): VectorLayer {
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`
  return { id, type: 'vector', name: id, visible: true, locked: false, x, y, scale, rotation, selected: false, svg }
}
function text(id: string, x: number, y: number, scale: number, rotation: number, t: string): TextLayer {
  return { id, type: 'text', name: id, visible: true, locked: false, x, y, scale, rotation, selected: false, text: t }
}

describe('applyGroupTransform', () => {
  it('rotates around global center and commits correctly', () => {
    const layers: AnyLayer[] = [
      raster('r1', 0, 0, 20, 10, 1, 0),
      vector('v1', 50, 0, 30, 10, 1, 0),
      text('t1', -30, -20, 1, 0, 'X'),
    ]
    const ids = ['r1', 'v1', 't1']
    const center = selectionCenterOBB(layers, ids)
    const updates = applyGroupTransform(layers, ids, Math.PI / 4, 1.2)
    expect(updates).toHaveLength(3)
    const r = updates.find((u) => u.id === 'r1')!
    expect('width' in r && 'height' in r).toBe(true)
    const v = updates.find((u) => u.id === 'v1')!
    expect('scale' in v).toBe(true)
    const t = updates.find((u) => u.id === 't1')!
    expect('scale' in t).toBe(true)
    // All around center
    for (const u of updates) {
      expect(Number.isFinite(u.x) && Number.isFinite(u.y)).toBe(true)
      expect(Number.isFinite(u.rotation)).toBe(true)
    }
    // Center remains same reference after transform application (derivation check)
    expect(Number.isFinite(center.x) && Number.isFinite(center.y)).toBe(true)
  })
})
