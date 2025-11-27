import { extend } from '@pixi/react'
import { Container, Sprite, Texture, Rectangle } from 'pixi.js'
import type { RasterLayer as RasterLayerType } from './layer.types'
extend({ Container, Sprite })

type Props = { layer: RasterLayerType }
export default function RasterLayer({ layer }: Props) {
  const texture = Texture.from(layer.image)
  const w = layer.width
  const h = layer.height
  return (
    <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation} visible={layer.visible} eventMode="static" hitArea={new Rectangle(0, 0, w, h)}>
      <pixiSprite texture={texture} width={layer.width} height={layer.height}>

      </pixiSprite>
    </pixiContainer>
  )
}
