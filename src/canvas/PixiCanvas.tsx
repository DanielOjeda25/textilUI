import { Application, extend } from '@pixi/react'
import { Graphics } from 'pixi.js'
import type { Graphics as PixiGraphics } from 'pixi.js'
extend({ Graphics })

export default function PixiCanvas() {
  const width = 1200
  const height = 800
  const background = 0xffffff

  return (
    <Application width={width} height={height} background={background}>
      <pixiGraphics
        draw={(g: PixiGraphics) => {
          g.clear()
          g.setFillStyle({ color: 0x3366ff })
          g.rect(50, 50, 200, 200)
          g.fill()
        }}
      />
    </Application>
  )
}
