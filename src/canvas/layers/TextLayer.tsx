import { extend } from '@pixi/react'
import { Container, Text, Rectangle } from 'pixi.js'
import type { TextLayer as TextLayerType } from './layer.types'
extend({ Container, Text })

type Props = { layer: TextLayerType }
export default function TextLayer({ layer }: Props) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.font = '16px Arial, sans-serif'
  const m = ctx.measureText(layer.text)
  const w = Math.ceil(m.width)
  const h = 20
  return (
    <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation} visible={layer.visible} eventMode="static" hitArea={new Rectangle(0, 0, w, h)}>
      <pixiText text={layer.text}>

      </pixiText>
    </pixiContainer>
  )
}
