import type { ViewportState } from '../viewport/viewport.types'

export function snapPoint(wx: number, wy: number, viewport: ViewportState, radiusScreen: number): { x: number; y: number } {
  const sx = wx * viewport.scale + viewport.x
  const sy = wy * viewport.scale + viewport.y
  const targetsX = [0, viewport.screenWidth / 2, viewport.screenWidth]
  const targetsY = [0, viewport.screenHeight / 2, viewport.screenHeight]
  let nx = wx
  let ny = wy
  for (const tx of targetsX) {
    if (Math.abs(sx - tx) <= radiusScreen) nx = (tx - viewport.x) / viewport.scale
  }
  for (const ty of targetsY) {
    if (Math.abs(sy - ty) <= radiusScreen) ny = (ty - viewport.y) / viewport.scale
  }
  return { x: nx, y: ny }
}

export function snapAngle(angle: number, stepDeg: number): number {
  const step = (stepDeg * Math.PI) / 180
  return Math.round(angle / step) * step
}

