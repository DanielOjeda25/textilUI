import { extend } from '@pixi/react'
import { Container, Graphics } from 'pixi.js'
import { useCanvasStore } from '../../state/useCanvasStore'
extend({ Container, Graphics })

export default function BoundingBoxLayer() {
    const layers = useCanvasStore((s) => s.layers)
    const selectedId = useCanvasStore((s) => s.selectedLayerId)
    const layer = layers.find((l) => l.id === selectedId)
    if (!layer) return null
    const w = layer.type === 'raster' ? layer.width : layer.type === 'text' ? 100 : 100
    const h = layer.type === 'raster' ? layer.height : layer.type === 'text' ? 40 : 100
    const handle = 8
    return (
        <pixiContainer x={layer.x} y={layer.y} scale={layer.scale} rotation={layer.rotation}>
            <pixiGraphics
                draw={(g) => {
                    g.clear()
                    g.setStrokeStyle({ width: 2, color: 0x00ffff })
                    g.rect(0, 0, w, h)
                    g.stroke()
                    g.setFillStyle({ color: 0x00ffff })
                    // corners
                    g.rect(-handle / 2, -handle / 2, handle, handle)
                    g.rect(w - handle / 2, -handle / 2, handle, handle)
                    g.rect(-handle / 2, h - handle / 2, handle, handle)
                    g.rect(w - handle / 2, h - handle / 2, handle, handle)
                    // sides
                    g.rect(w / 2 - handle / 2, -handle / 2, handle, handle)
                    g.rect(w / 2 - handle / 2, h - handle / 2, handle, handle)
                    g.rect(-handle / 2, h / 2 - handle / 2, handle, handle)
                    g.rect(w - handle / 2, h / 2 - handle / 2, handle, handle)
                    // rotation handle
                    g.rect(w / 2 - handle / 2, -30 - handle / 2, handle, handle)
                    g.fill()
                }}
            />
        </pixiContainer>
    )
}

