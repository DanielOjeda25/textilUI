import { Application, extend } from '@pixi/react'
import { Container, Graphics, Sprite, Text } from 'pixi.js'
import type { Graphics as PixiGraphics } from 'pixi.js'
import { useEffect } from 'react'
import { useViewport } from './viewport/useViewport'
import { useCanvasInteraction } from '../hooks/useCanvasInteraction'
import { useCanvasStore } from '../state/useCanvasStore'
import RasterLayer from './layers/RasterLayer'
import VectorLayer from './layers/VectorLayer.tsx'
import TextLayer from './layers/TextLayer'
import BoundingBoxLayer from './tools/BoundingBoxLayer'
extend({ Container, Graphics, Sprite, Text })


export default function PixiCanvas() {
  const width = 1200
  const height = 800
  const background = 0xffffff
  return (
    <Application width={width} height={height} background={background}>
      <SceneWithSize width={width} height={height} />
    </Application>
  )
}

type SceneProps = { width: number; height: number }
function SceneWithSize({ width, height }: SceneProps) {
  const { viewport, controller } = useViewport()
  const layers = useCanvasStore((s) => s.layers)
  useEffect(() => {
    controller.setScreenSize(width, height)
    controller.setContentSize(1000, 1000)
  }, [controller, width, height])
  useCanvasInteraction(controller)
  const { handlers } = useCanvasInteraction(controller)
  const checkerSize = 16
  return (
    <>
      {viewport.screenWidth > 0 && viewport.screenHeight > 0 && (
        <pixiGraphics
          draw={(g: PixiGraphics) => {
            g.clear()
            for (let y = 0; y < viewport.screenHeight; y += checkerSize) {
              for (let x = 0; x < viewport.screenWidth; x += checkerSize) {
                const isDark = ((x / checkerSize) + (y / checkerSize)) % 2 === 0
                g.setFillStyle({ color: isDark ? 0xbdbdbd : 0xffffff })
                g.rect(x, y, checkerSize, checkerSize)
                g.fill()
              }
            }
          }}
        />
      )}
      <pixiContainer scale={viewport.scale} x={viewport.x} y={viewport.y} eventMode="static" onPointerDown={handlers.onPointerDown} onPointerMove={handlers.onPointerMove} onPointerUp={handlers.onPointerUp}>
        {layers.map((layer) => {
          if (layer.type === 'raster') return <RasterLayer key={layer.id} layer={layer} />
          if (layer.type === 'vector') return <VectorLayer key={layer.id} layer={layer} />
          if (layer.type === 'text') return <TextLayer key={layer.id} layer={layer} />
          return null
        })}
        <BoundingBoxLayer />
      </pixiContainer>
    </>
  )
}
