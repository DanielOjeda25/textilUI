import type { Point } from './obb'

function dot(a: Point, b: Point): number { return a.x * b.x + a.y * b.y }
function norm(v: Point): Point { const d = Math.hypot(v.x, v.y); return d > 0 ? { x: v.x / d, y: v.y / d } : { x: 0, y: 0 } }

function projectInterval(points: Point[], axis: Point): { min: number; max: number } {
  let min = dot(points[0], axis)
  let max = min
  for (let i = 1; i < points.length; i++) {
    const p = dot(points[i], axis)
    if (p < min) min = p
    if (p > max) max = p
  }
  return { min, max }
}

export function polygonAABBIntersect(corners: Point[], minX: number, minY: number, maxX: number, maxY: number): boolean {
  const axes: Point[] = [
    norm({ x: corners[1].x - corners[0].x, y: corners[1].y - corners[0].y }),
    norm({ x: corners[3].x - corners[0].x, y: corners[3].y - corners[0].y }),
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ]
  const rectCorners: Point[] = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ]
  for (const axis of axes) {
    const pPoly = projectInterval(corners, axis)
    const pRect = projectInterval(rectCorners, axis)
    if (pPoly.max < pRect.min || pRect.max < pPoly.min) return false
  }
  return true
}

export function polygonAABBContained(corners: Point[], minX: number, minY: number, maxX: number, maxY: number): boolean {
  for (const c of corners) {
    if (c.x < minX || c.x > maxX || c.y < minY || c.y > maxY) return false
  }
  return true
}
