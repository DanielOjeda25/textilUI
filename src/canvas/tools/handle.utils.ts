import type { AnyLayer } from '../layers/layer.types'

export type Point = { x: number; y: number }

export function getBounds(layer: AnyLayer): { width: number; height: number } {
  if (layer.type === 'raster') return { width: layer.width, height: layer.height }
  if (layer.type === 'vector') {
    const wMatch = layer.svg.match(/\bwidth\s*=\s*"([0-9.]+)"/)
    const hMatch = layer.svg.match(/\bheight\s*=\s*"([0-9.]+)"/)
    if (wMatch && hMatch) return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) }
    const vbMatch = layer.svg.match(/viewBox\s*=\s*"([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"/)
    if (vbMatch) return { width: parseFloat(vbMatch[3]), height: parseFloat(vbMatch[4]) }
    return { width: 100, height: 100 }
  }
  const text = layer.text
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.font = '16px Arial, sans-serif'
  const metrics = ctx.measureText(text)
  const width = Math.ceil(metrics.width)
  const height = 20
  return { width, height }
}

export function rotate(p: Point, angle: number): Point {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: c * p.x - s * p.y, y: s * p.x + c * p.y }
}

export function cornersWorld(layer: AnyLayer): Point[] {
  const { width, height } = getBounds(layer)
  const pts: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ]
  return pts.map((p) => {
    const rp = rotate({ x: p.x * layer.scale, y: p.y * layer.scale }, layer.rotation)
    return { x: rp.x + layer.x, y: rp.y + layer.y }
  })
}

export function sidesWorld(layer: AnyLayer): Point[] {
  const c = cornersWorld(layer)
  return [
    mid(c[0], c[1]),
    mid(c[1], c[2]),
    mid(c[2], c[3]),
    mid(c[3], c[0]),
  ]
}

function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function rotateHandleWorld(layer: AnyLayer, viewportScale: number): Point {
  const c = cornersWorld(layer)
  const topMid = mid(c[0], c[1])
  const offset = 30 / viewportScale
  const dir = normalize({ x: topMid.x - layer.x, y: topMid.y - layer.y })
  return { x: topMid.x + dir.x * offset, y: topMid.y + dir.y * offset }
}

function normalize(p: Point): Point {
  const d = Math.hypot(p.x, p.y)
  if (d === 0) return { x: 0, y: 0 }
  return { x: p.x / d, y: p.y / d }
}

export type HandleKind = 'corner' | 'side' | 'rotate' | null

export function detectHandle(world: Point, layer: AnyLayer, viewportScale: number, radiusScreen: number): { kind: HandleKind; index?: number } {
  const r = radiusScreen / viewportScale
  const cs = cornersWorld(layer)
  for (let i = 0; i < cs.length; i++) {
    if (Math.hypot(world.x - cs[i].x, world.y - cs[i].y) <= r) return { kind: 'corner', index: i }
  }
  const ss = sidesWorld(layer)
  for (let i = 0; i < ss.length; i++) {
    if (Math.hypot(world.x - ss[i].x, world.y - ss[i].y) <= r) return { kind: 'side', index: i }
  }
  const rot = rotateHandleWorld(layer, viewportScale)
  if (Math.hypot(world.x - rot.x, world.y - rot.y) <= r) return { kind: 'rotate' }
  return { kind: null }
}

export function anchorForHandle(kind: Exclude<HandleKind, null>, index: number | undefined, layer: AnyLayer): Point {
  const cs = cornersWorld(layer)
  const ss = sidesWorld(layer)
  if (kind === 'corner' && index !== undefined) return cs[(index + 2) % 4]
  if (kind === 'side' && index !== undefined) return ss[(index + 2) % 4]
  return { x: layer.x + rotate({ x: getBounds(layer).width * layer.scale / 2, y: getBounds(layer).height * layer.scale / 2 }, layer.rotation).x - rotate({ x: getBounds(layer).width * layer.scale / 2, y: getBounds(layer).height * layer.scale / 2 }, layer.rotation).x, y: layer.y }
}
