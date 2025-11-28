import type { AnyLayer } from '../layers/layer.types'
import { getBounds, rotate } from '../tools/handle.utils'

export type Point = { x: number; y: number }
export type OBB = { center: Point; u: Point; v: Point; halfWidth: number; halfHeight: number; vertices: Point[] }

export function worldCorners(layer: AnyLayer): Point[] {
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

export function layerCenterWorld(layer: AnyLayer): Point {
    const { width, height } = getBounds(layer)
    const off = rotate({ x: (width * layer.scale) / 2, y: (height * layer.scale) / 2 }, layer.rotation)
    return { x: layer.x + off.x, y: layer.y + off.y }
}

function dot(a: Point, b: Point): number { return a.x * b.x + a.y * b.y }
function sub(a: Point, b: Point): Point { return { x: a.x - b.x, y: a.y - b.y } }
function length(a: Point): number { return Math.hypot(a.x, a.y) }
function normalize(a: Point): Point { const d = length(a); return d > 0 ? { x: a.x / d, y: a.y / d } : { x: 1, y: 0 } }

export function computeOBB(points: Point[]): OBB {
    const n = points.length
    let mx = 0, my = 0
    for (const p of points) { mx += p.x; my += p.y }
    mx /= n; my /= n
    let sxx = 0, sxy = 0, syy = 0
    for (const p of points) {
        const dx = p.x - mx
        const dy = p.y - my
        sxx += dx * dx
        sxy += dx * dy
        syy += dy * dy
    }
    const tr = sxx + syy
    const det = sxx * syy - sxy * sxy
    const tmp = Math.sqrt(Math.max(0, tr * tr - 4 * det))
    const l1 = (tr + tmp) / 2
    let u = normalize({ x: sxy, y: l1 - sxx })
    if (length(u) === 0) u = { x: 1, y: 0 }
    const v = { x: -u.y, y: u.x }
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
    for (const p of points) {
        const rel = sub(p, { x: mx, y: my })
        const pu = dot(rel, u)
        const pv = dot(rel, v)
        if (pu < minU) minU = pu
        if (pu > maxU) maxU = pu
        if (pv < minV) minV = pv
        if (pv > maxV) maxV = pv
    }
    const halfWidth = (maxU - minU) / 2
    const halfHeight = (maxV - minV) / 2
    const center = { x: mx + u.x * (minU + halfWidth) + v.x * (minV + halfHeight), y: my + u.y * (minU + halfWidth) + v.y * (minV + halfHeight) }
    const vertices = [
        { x: center.x + u.x * halfWidth + v.x * halfHeight, y: center.y + u.y * halfWidth + v.y * halfHeight },
        { x: center.x - u.x * halfWidth + v.x * halfHeight, y: center.y - u.y * halfWidth + v.y * halfHeight },
        { x: center.x - u.x * halfWidth - v.x * halfHeight, y: center.y - u.y * halfWidth - v.y * halfHeight },
        { x: center.x + u.x * halfWidth - v.x * halfHeight, y: center.y + u.y * halfWidth - v.y * halfHeight },
    ]
    return { center, u, v, halfWidth, halfHeight, vertices }
}

export function selectionOBB(layers: AnyLayer[]): OBB {
    const pts: Point[] = []
    for (const l of layers) {
        if (!l.visible || l.locked) continue
        pts.push(...worldCorners(l))
    }
    return computeOBB(pts)
}

export function topLeftFromCenter(center: Point, rotation: number, width: number, height: number, scale: number): Point {
    const off = rotate({ x: (width * scale) / 2, y: (height * scale) / 2 }, rotation)
    return { x: center.x - off.x, y: center.y - off.y }
}
