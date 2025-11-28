import { worldCorners, selectionOBB, layerCenterWorld, topLeftFromCenter } from '../geometry/obb'
import { polygonAABBIntersect, polygonAABBContained } from '../geometry/sat'
import type { AnyLayer, RasterLayer } from '../layers/layer.types'
import { isWithinLayer, getBounds } from '../tools/handle.utils'

export type RectWorld = { minX: number; minY: number; maxX: number; maxY: number }

export function selectByRect(layers: AnyLayer[], rect: RectWorld, mode: 'intersect' | 'contain'): string[] {
  const out: string[] = []
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i]
    if (!l.visible || l.locked) continue
    const corners = worldCorners(l)
    let hit = false
    if (mode === 'intersect') hit = polygonAABBIntersect(corners, rect.minX, rect.minY, rect.maxX, rect.maxY)
    else hit = polygonAABBContained(corners, rect.minX, rect.minY, rect.maxX, rect.maxY)
    if (hit) out.push(l.id)
  }
  return Array.from(new Set(out))
}

export function pickTopAtPoint(layers: AnyLayer[], world: { x: number; y: number }): string | null {
  for (let i = layers.length - 1; i >= 0; i--) {
    const l = layers[i]
    if (!l.visible || l.locked) continue
    if (isWithinLayer(world, l)) return l.id
  }
  return null
}

export function selectionCenterOBB(layers: AnyLayer[], ids: string[]): { x: number; y: number } {
  const set = new Set(ids)
  const group = layers.filter((l) => set.has(l.id) && l.visible && !l.locked)
  const obb = selectionOBB(group)
  return obb.center
}

export function applyGroupTransform(
  layers: AnyLayer[],
  ids: string[],
  deltaRot: number,
  scale: number,
): { id: string; x: number; y: number; rotation: number; scale?: number; width?: number; height?: number }[] {
  const set = new Set(ids)
  const group = layers.filter((l) => set.has(l.id) && l.visible && !l.locked)
  const center = selectionOBB(group).center
  const clampScale = (s: number) => Math.min(5, Math.max(0.1, s))
  const out: { id: string; x: number; y: number; rotation: number; scale?: number; width?: number; height?: number }[] = []
  for (const l of group) {
    const startC = layerCenterWorld(l)
    const vx = startC.x - center.x
    const vy = startC.y - center.y
    const c = Math.cos(deltaRot)
    const s = Math.sin(deltaRot)
    const rx = c * vx - s * vy
    const ry = s * vx + c * vy
    const sx = rx * scale
    const sy = ry * scale
    const newCenter = { x: center.x + sx, y: center.y + sy }
    const newRot = l.rotation + deltaRot
    if (l.type === 'raster') {
      const r = l as RasterLayer
      const baseW = r.originalWidth ?? r.width
      const baseH = r.originalHeight ?? r.height
      const nextW = Math.max(1, Math.round(baseW * clampScale(scale)))
      const nextH = Math.max(1, Math.round(baseH * clampScale(scale)))
      const tl = topLeftFromCenter(newCenter, newRot, nextW, nextH, 1)
      out.push({ id: l.id, x: tl.x, y: tl.y, rotation: newRot, width: nextW, height: nextH })
    } else {
      const { width, height } = getBounds(l)
      const nextS = clampScale(l.scale * scale)
      const tl = topLeftFromCenter(newCenter, newRot, width, height, nextS)
      out.push({ id: l.id, x: tl.x, y: tl.y, rotation: newRot, scale: nextS })
    }
  }
  return out
}
