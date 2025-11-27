import { extend } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { useCanvasStore } from '../../state/useCanvasStore'
import { getBounds } from './handle.utils'
extend({ Container, Graphics })

export default function BoundingBoxLayer() {
  const layers = useCanvasStore((s) => s.layers)
  const selectedId = useCanvasStore((s) => s.selectedLayerId)
  const viewport = useCanvasStore((s) => s.viewport)
  const layer = layers.find((l) => l.id === selectedId)
  if (!layer) return null
  const { width: w, height: h } = getBounds(layer)
  const handle = 8 / viewport.scale
  const stroke = 2 / viewport.scale
  return (
    <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation}>
      <pixiGraphics
        draw={(g) => {
          g.clear()
          g.setStrokeStyle({ width: stroke, color: 0x00ffff })
          g.rect(0, 0, w, h)
          g.stroke()
          g.setFillStyle({ color: 0x00ffff })
          g.rect(-handle / 2, -handle / 2, handle, handle)
          g.rect(w - handle / 2, -handle / 2, handle, handle)
          g.rect(-handle / 2, h - handle / 2, handle, handle)
          g.rect(w - handle / 2, h - handle / 2, handle, handle)
          g.rect(w / 2 - handle / 2, -handle / 2, handle, handle)
          g.rect(w / 2 - handle / 2, h - handle / 2, handle, handle)
          g.rect(-handle / 2, h / 2 - handle / 2, handle, handle)
          g.rect(w - handle / 2, h / 2 - handle / 2, handle, handle)
          g.rect(w / 2 - handle / 2, -30 / viewport.scale - handle / 2, handle, handle)
          g.fill()
        }}
      />
    </pixiContainer>
  )
}

