import { extend } from '@pixi/react'
import { Container, Sprite, Texture, Rectangle } from 'pixi.js'
import type { VectorLayer as VectorLayerType } from './layer.types'
extend({ Container, Sprite })

type Props = { layer: VectorLayerType }
export default function VectorLayer({ layer }: Props) {
  const base64 = btoa(layer.svg)
  const src = `data:image/svg+xml;base64,${base64}`
  const texture = Texture.from(src)
  const svg = layer.svg
  const wMatch = svg.match(/\bwidth\s*=\s*"([0-9.]+)"/)
  const hMatch = svg.match(/\bheight\s*=\s*"([0-9.]+)"/)
  const vbMatch = svg.match(/viewBox\s*=\s*"([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"/)
  const w = wMatch && hMatch ? parseFloat(wMatch[1]) : vbMatch ? parseFloat(vbMatch[3]) : 100
  const h = wMatch && hMatch ? parseFloat(hMatch[1]) : vbMatch ? parseFloat(vbMatch[4]) : 100
  return (
    <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation} visible={layer.visible} eventMode="static" hitArea={new Rectangle(0, 0, w, h)}>
      <pixiSprite texture={texture}>

      </pixiSprite>
    </pixiContainer>
  )
}
