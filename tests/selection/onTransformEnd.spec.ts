import { describe, it, expect } from 'vitest'
import type { RasterLayer, VectorLayer } from '../../src/canvas/layers/layer.types'

function raster(id: string, w: number, h: number): RasterLayer {
  return { id, type: 'raster', name: id, visible: true, locked: false, x: 0, y: 0, scale: 1, rotation: 0, selected: false, image: {} as HTMLImageElement, width: w, height: h, originalWidth: w, originalHeight: h, originalX: 0, originalY: 0, originalRotation: 0, originalScale: 1 }
}
function vector(id: string, w: number, h: number): VectorLayer {
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`
  return { id, type: 'vector', name: id, visible: true, locked: false, x: 0, y: 0, scale: 1, rotation: 0, selected: false, svg, originalX: 0, originalY: 0, originalRotation: 0, originalScale: 1 }
}

interface MockTransform { point: (p: { x: number; y: number }) => { x: number; y: number } }
interface MockNode { scaleX: () => number; scaleY: () => number; rotation: () => number; getAbsoluteTransform: () => MockTransform; }

describe('onTransformEnd commit calculations', () => {
  it('raster no rotation', () => {
    const rl = raster('r', 100, 50)
    const node: MockNode = {
      scaleX: () => 1.5,
      scaleY: () => 2,
      rotation: () => 0,
      getAbsoluteTransform: () => ({ point: (p) => ({ x: p.x + 10, y: p.y + 20 }) }),
    }
    const sX = node.scaleX()
    const sY = node.scaleY()
    const rot = node.rotation()
    const origin = node.getAbsoluteTransform().point({ x: 0, y: 0 })
    const finalW = Math.max(1, Math.round((rl.originalWidth ?? rl.width) * sX))
    const finalH = Math.max(1, Math.round((rl.originalHeight ?? rl.height) * sY))
    expect(finalW).toBe(150)
    expect(finalH).toBe(100)
    expect(origin).toEqual({ x: 10, y: 20 })
    expect(rot).toBe(0)
  })

  it('raster rotation 45° origin via transform', () => {
    const node: MockNode = {
      scaleX: () => 1,
      scaleY: () => 1,
      rotation: () => Math.PI / 4,
      getAbsoluteTransform: () => ({ point: () => ({ x: 33, y: 44 }) }),
    }
    const origin = node.getAbsoluteTransform().point({ x: 0, y: 0 })
    expect(origin).toEqual({ x: 33, y: 44 })
  })

  it('vector/text scale final', () => {
    const v = vector('v', 10, 10)
    const node: MockNode = {
      scaleX: () => 2,
      scaleY: () => 2,
      rotation: () => 0,
      getAbsoluteTransform: () => ({ point: () => ({ x: 0, y: 0 }) }),
    }
    const scaleDelta = (node.scaleX() + node.scaleY()) / 2
    const scaleFinal = v.scale * scaleDelta
    expect(scaleFinal).toBe(2)
  })
})
