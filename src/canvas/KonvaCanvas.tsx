import { Stage, Layer as KonvaLayer, Image as KonvaImage, Text as KonvaText, Group, Transformer } from 'react-konva'
import { useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '../state/useCanvasStore'

export type KonvaCanvasProps = { width: number; height: number }

export default function KonvaCanvas({ width, height }: KonvaCanvasProps) {
    const { viewport } = useCanvasStore()
    const selectedId = useCanvasStore((s) => s.selectedLayerId)
    const layers = useCanvasStore((s) => s.layers)
    const stageRef = useRef<any>(null)
    const [spaceDown, setSpaceDown] = useState(false)

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') setSpaceDown(true) }
        const onKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setSpaceDown(false) }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
    }, [])

    const onWheel = (e: any) => {
        e.evt.preventDefault()
        const stage = stageRef.current
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        }
        const scaleBy = 1.03
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        stage.scale({ x: newScale, y: newScale })
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        }
        stage.position(newPos)
        useCanvasStore.setState((s) => ({ ...s, viewport: { ...s.viewport, scale: newScale, x: newPos.x, y: newPos.y, screenWidth: width, screenHeight: height } }))
    }

    const onDragMoveStage = (e: any) => {
        const stage = e.target.getStage()
        const pos = stage.position()
        useCanvasStore.setState((s) => ({ ...s, viewport: { ...s.viewport, x: pos.x, y: pos.y } }))
    }

    //

    return (
        <div style={{ width, height }} className="h-full w-full">
            <Stage ref={stageRef} width={width} height={height} draggable={spaceDown} x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale} onWheel={onWheel} onDragMove={onDragMoveStage}>
                <KonvaLayer>
                    {layers.map((l) => (
                        <Group key={l.id} x={l.x} y={l.y} rotation={l.rotation} scaleX={l.scale} scaleY={l.scale} draggable={l.selected} onClick={() => useCanvasStore.getState().selectLayer(l.id)} onDragEnd={(e) => {
                            const p = e.target.position()
                            useCanvasStore.getState().updateLayer(l.id, { x: p.x, y: p.y })
                        }}>
                            {l.type === 'raster' && (
                                <KonvaImage image={l.image} width={l.width} height={l.height} />
                            )}
                            {l.type === 'text' && (
                                <KonvaText text={(l as any).text || ''} fontSize={24} fill="#000" />
                            )}
                            {selectedId === l.id && (
                                <Transformer
                                    rotateEnabled
                                    keepRatio={false}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        const minW = 10
                                        const minH = 10
                                        if (Math.abs(newBox.width) < minW || Math.abs(newBox.height) < minH) return oldBox
                                        return newBox
                                    }}
                                    onTransformEnd={(e: any) => {
                                        const node = e.target.getNode()
                                        const p = node.getAbsolutePosition()
                                        const rot = node.rotation()
                                        const sX = node.scaleX()
                                        const sY = node.scaleY()
                                        const s = Math.max(Math.abs((sX + sY) / 2), 0.0001)
                                        useCanvasStore.getState().updateLayer(l.id, { x: p.x, y: p.y, rotation: rot, scale: s })
                                        node.scaleX(1); node.scaleY(1)
                                    }}
                                />
                            )}
                        </Group>
                    ))}
                </KonvaLayer>
            </Stage>
        </div>
    )
}
