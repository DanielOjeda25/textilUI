import { Stage, Layer as KonvaLayer, Image as KonvaImage, Text as KonvaText, Group, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '../state/useCanvasStore'

export type KonvaCanvasProps = { width: number; height: number }

export default function KonvaCanvas({ width, height }: KonvaCanvasProps) {
    const { viewport } = useCanvasStore()
    const selectedId = useCanvasStore((s) => s.selectedLayerId)
    const layers = useCanvasStore((s) => s.layers)
    const stageRef = useRef<Konva.Stage | null>(null)
    const [spaceDown, setSpaceDown] = useState(false)

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') setSpaceDown(true)
            if (e.key === 'Escape') {
                useCanvasStore.setState((s) => ({
                    ...s,
                    layers: s.layers.map((l) => ({ ...l, selected: false })),
                    selectedLayerId: null,
                }))
            }
        }
        const onKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setSpaceDown(false) }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
    }, [])

    const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault()
        const stage = stageRef.current as Konva.Stage
        const oldScale = stage.scaleX()
        const pointer = stage.getPointerPosition()
        if (!pointer) return
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        }
        const scaleBy = 1.03
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        stage.scale({ x: newScale, y: newScale })
        const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale }
        stage.position(newPos)
        useCanvasStore.setState((s) => ({ ...s, viewport: { ...s.viewport, scale: newScale, x: newPos.x, y: newPos.y, screenWidth: width, screenHeight: height } }))
    }

    const onDragMoveStage = (e: Konva.KonvaEventObject<DragEvent>) => {
        const stage = (e.target as Konva.Stage | Konva.Node).getStage() as Konva.Stage
        const pos = stage.position()
        useCanvasStore.setState((s) => ({ ...s, viewport: { ...s.viewport, x: pos.x, y: pos.y } }))
    }

    function clampNodeToViewport(node: Konva.Node) {
        const stage = stageRef.current as Konva.Stage
        if (!stage) return
        const rect = node.getClientRect({ skipShadow: true, skipStroke: true })
        const w = stage.width()
        const h = stage.height()
        let dx = 0
        let dy = 0
        if (rect.x < 0) dx = -rect.x
        if (rect.y < 0) dy = -rect.y
        if (rect.x + rect.width + dx > w) dx -= (rect.x + rect.width + dx - w)
        if (rect.y + rect.height + dy > h) dy -= (rect.y + rect.height + dy - h)
        if (dx || dy) {
            const p = node.position()
            node.position({ x: p.x + dx, y: p.y + dy })
        }
    }

    return (
        <div style={{ width, height }} className="h-full w-full">
            <Stage ref={stageRef} width={width} height={height} draggable={spaceDown} x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale} onWheel={onWheel} onDragMove={onDragMoveStage}>
                <KonvaLayer>
                    {layers.map((l) => (
                        <Group key={l.id} x={l.x} y={l.y} rotation={l.rotation} scaleX={l.scale} scaleY={l.scale} visible={l.visible} draggable={l.selected && !l.locked} onClick={() => useCanvasStore.getState().selectLayer(l.id)} onMouseEnter={() => {
                            const stage = stageRef.current
                            if (stage) stage.container().style.cursor = 'move'
                        }} onMouseLeave={() => {
                            const stage = stageRef.current
                            if (stage) stage.container().style.cursor = 'default'
                        }} onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
                            clampNodeToViewport(e.target as Konva.Node)
                        }} onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
                            const p = (e.target as Konva.Node).position()
                            useCanvasStore.getState().updateLayer(l.id, { x: p.x, y: p.y })
                        }}>
                            {l.type === 'raster' && (
                                <KonvaImage image={l.image} width={l.width} height={l.height} />
                            )}
                            {l.type === 'text' && (
                                <KonvaText text={('text' in l && (l as unknown as { text?: string }).text) || ''} fontSize={24} fill="#000" />
                            )}
                            {selectedId === l.id && l.visible && !l.locked && (
                                <Transformer
                                    rotateEnabled
                                    keepRatio={false}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        const minW = 10
                                        const minH = 10
                                        if (Math.abs(newBox.width) < minW || Math.abs(newBox.height) < minH) return oldBox
                                        return newBox
                                    }}
                                    onMouseEnter={() => {
                                        const stage = stageRef.current
                                        if (stage) stage.container().style.cursor = 'pointer'
                                    }}
                                    onMouseLeave={() => {
                                        const stage = stageRef.current
                                        if (stage) stage.container().style.cursor = 'default'
                                    }}
                                    onTransformEnd={(e: Konva.KonvaEventObject<Event>) => {
                                        const node = (e.target as unknown as { getNode: () => Konva.Node }).getNode()
                                        const p = node.getAbsolutePosition()
                                        const rot = node.rotation()
                                        const sX = node.scaleX()
                                        const sY = node.scaleY()
                                        const s = Math.max(Math.abs((sX + sY) / 2), 0.0001)
                                        clampNodeToViewport(node)
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
