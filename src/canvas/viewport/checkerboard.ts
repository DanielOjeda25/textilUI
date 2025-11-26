import { Texture } from 'pixi.js'

export interface CheckerboardOptions {
  size?: number
  colorA?: string
  colorB?: string
  opacity?: number
}

export function createCheckerboardTexture(options: CheckerboardOptions = {}): Texture {
  const size = options.size ?? 16
  const colorA = options.colorA ?? '#bdbdbd'
  const colorB = options.colorB ?? '#ffffff'
  const opacity = options.opacity ?? 1
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 2}" height="${size * 2}" viewBox="0 0 ${size * 2} ${size * 2}"><rect width="${size * 2}" height="${size * 2}" fill="${colorB}" fill-opacity="${opacity}"/><rect x="0" y="0" width="${size}" height="${size}" fill="${colorA}" fill-opacity="${opacity}"/><rect x="${size}" y="${size}" width="${size}" height="${size}" fill="${colorA}" fill-opacity="${opacity}"/></svg>`
  const base64 = btoa(svg)
  const src = `data:image/svg+xml;base64,${base64}`
  const tex = Texture.from(src)
  return tex
}
