import { describe, it, expect } from 'vitest'
import type { AnyLayer, RasterLayer, VectorLayer } from '../../src/canvas/layers/layer.types'
import { worldCorners, layerCenterWorld, computeOBB } from '../../src/canvas/geometry/obb'

function raster(id: string, x: number, y: number, w: number, h: number, scale: number, rotation: number): RasterLayer {
  return { id, type: 'raster', name: id, visible: true, locked: false, x, y, scale, rotation, selected: false, image: {} as HTMLImageElement, width: w, height: h }
}

function vector(id: string, x: number, y: number, w: number, h: number, scale: number, rotation: number): VectorLayer {
  const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`
  return { id, type: 'vector', name: id, visible: true, locked: false, x, y, scale, rotation, selected: false, svg }
}

describe('worldCorners', () => {
  it('rotation 0 with scale 1', () => {
    const l = raster('r0', 10, 20, 100, 50, 1, 0)
    const c = worldCorners(l as AnyLayer)
    expect(c[0]).toEqual({ x: 10, y: 20 })
    expect(c[2]).toEqual({ x: 110, y: 70 })
  })
  it('rotation 90°', () => {
    const l = vector('v90', 0, 0, 100, 50, 1, Math.PI / 2)
    const c = worldCorners(l as AnyLayer)
    const xs = c.map((p) => p.x)
    const ys = c.map((p) => p.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(50, 4)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(100, 4)
  })
  it('rotation 45° and scale 2', () => {
    const l = raster('r45', 0, 0, 20, 10, 2, Math.PI / 4)
    const c = worldCorners(l as AnyLayer)
    const obb = computeOBB(c)
    expect(obb.halfWidth).toBeGreaterThan(0)
    expect(obb.halfHeight).toBeGreaterThan(0)
  })
})

describe('layerCenterWorld', () => {
  it('center reflects rotation and scale', () => {
    const l = raster('rc', 100, 100, 40, 20, 1.5, Math.PI / 3)
    const center = layerCenterWorld(l as AnyLayer)
    const c = worldCorners(l as AnyLayer)
    const cx = (c[0].x + c[2].x) / 2
    const cy = (c[0].y + c[2].y) / 2
    expect(center.x).toBeCloseTo(cx, 6)
    expect(center.y).toBeCloseTo(cy, 6)
  })
})

describe('computeOBB', () => {
  it('center near mean of points', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 5 },
      { x: 0, y: 5 },
    ]
    const obb = computeOBB(pts)
    expect(obb.center.x).toBeCloseTo(5, 6)
    expect(obb.center.y).toBeCloseTo(2.5, 6)
  })
})
