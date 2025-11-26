import { extend } from '@pixi/react'
import { Container, Text } from 'pixi.js'
import type { TextLayer as TextLayerType } from './layer.types'
extend({ Container, Text })

type Props = { layer: TextLayerType }
export default function TextLayer({ layer }: Props) {
  return (
    <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation} visible={layer.visible}>
      <pixiText text={layer.text}>
        
      </pixiText>
    </pixiContainer>
  )
}

