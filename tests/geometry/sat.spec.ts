import { describe, it, expect } from 'vitest'
import { polygonAABBIntersect, polygonAABBContained } from '../../src/canvas/geometry/sat'

function rot(x: number, y: number, a: number) { const c = Math.cos(a); const s = Math.sin(a); return { x: c * x - s * y, y: s * x + c * y } }

describe('polygonAABBIntersect', () => {
  it('intersects axis-aligned', () => {
    const corners = [ { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 } ]
    expect(polygonAABBIntersect(corners, 5, 5, 15, 15)).toBe(true)
  })
  it('no intersection', () => {
    const corners = [ { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 } ]
    expect(polygonAABBIntersect(corners, 20, 20, 30, 30)).toBe(false)
  })
  it('intersects with extreme rotation', () => {
    const base = [ { x: -5, y: -2 }, { x: 5, y: -2 }, { x: 5, y: 2 }, { x: -5, y: 2 } ]
    const a = Math.PI * 0.49
    const corners = base.map((p) => rot(p.x, p.y, a))
    expect(polygonAABBIntersect(corners, -1, -1, 1, 1)).toBe(true)
  })
})

describe('polygonAABBContained', () => {
  it('contained', () => {
    const corners = [ { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 } ]
    expect(polygonAABBContained(corners, 0, 0, 5, 5)).toBe(true)
  })
  it('not contained when a vertex out', () => {
    const corners = [ { x: -1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 } ]
    expect(polygonAABBContained(corners, 0, 0, 5, 5)).toBe(false)
  })
})
