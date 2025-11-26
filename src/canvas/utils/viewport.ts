export type Viewport = { x: number; y: number; scale: number }

export function clampScale(scale: number, min: number, max: number) {
  return Math.min(max, Math.max(min, scale))
}

export function applyPan(v: Viewport, dx: number, dy: number): Viewport {
  return { ...v, x: v.x + dx, y: v.y + dy }
}

export function applyZoom(v: Viewport, s: number): Viewport {
  const scale = clampScale(v.scale * s, 0.1, 10)
  return { ...v, scale }
}
