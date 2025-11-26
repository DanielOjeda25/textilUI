import { extend } from '@pixi/react'
import { Container, Sprite, Texture } from 'pixi.js'
import type { VectorLayer as VectorLayerType } from './layer.types'
extend({ Container, Sprite })

type Props = { layer: VectorLayerType }
export default function VectorLayer({ layer }: Props) {
  const base64 = btoa(layer.svg)
  const src = `data:image/svg+xml;base64,${base64}`
  const texture = Texture.from(src)
  return (
    <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation} visible={layer.visible}>
      <pixiSprite texture={texture}>
        
      </pixiSprite>
    </pixiContainer>
  )
}

