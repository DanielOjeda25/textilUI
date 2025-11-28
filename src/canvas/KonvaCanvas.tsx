import { Stage, Layer as KonvaLayer, Image as KonvaImage, Text as KonvaText, Group, Transformer, Path as KonvaPath } from 'react-konva'
import type Konva from 'konva'
import { memo, useEffect, useRef, useState } from 'react'
import { useCanvasStore } from '../state/useCanvasStore'
import type { RasterLayer, TextLayer, VectorLayer } from './layers/layer.types'
import { shallow } from 'zustand/shallow'

export type KonvaCanvasProps = { width: number; height: number }

export default function KonvaCanvas({ width, height }: KonvaCanvasProps) {
    const viewport = useCanvasStore((s) => s.viewport, shallow)
    const selectedId = useCanvasStore((s) => s.selectedLayerId)
    const layerIds = useCanvasStore((s) => s.layers.map((l) => l.id), shallow)
    const selectedLayer = useCanvasStore((s) => s.layers.find((l) => l.id === s.selectedLayerId) || null)
    const stageRef = useRef<Konva.Stage | null>(null)
    const transformerRef = useRef<Konva.Transformer | null>(null)
    const selectedNodeRef = useRef<Konva.Node | null>(null)
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

    useEffect(() => {
        const tr = transformerRef.current
        const node = selectedNodeRef.current
        if (tr && node && selectedLayer && selectedLayer.visible && !selectedLayer.locked) {
            tr.nodes([node])
            tr.getLayer()?.batchDraw()
        } else if (tr) {
            tr.nodes([])
            tr.getLayer()?.batchDraw()
        }
    }, [selectedId, selectedLayer])

    return (
        <div style={{ width, height }} className="h-full w-full">
            <Stage ref={stageRef} width={width} height={height} draggable={spaceDown} x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale} onWheel={onWheel} onDragMove={onDragMoveStage}>
                <KonvaLayer>
                    {layerIds.map((id) => (
                        <LayerNode
                            key={id}
                            id={id}
                            isSelected={selectedId === id}
                            stageRef={stageRef}
                            clampNodeToViewport={clampNodeToViewport}
                            selectedNodeRef={selectedNodeRef}
                        />
                    ))}
                </KonvaLayer>
                <KonvaLayer>
                    {selectedLayer && selectedLayer.visible && !selectedLayer.locked && (
                        <Transformer
                            ref={transformerRef as unknown as React.Ref<Konva.Transformer>}
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
                            onTransform={() => {
                                const node = transformerRef.current?.nodes()[0]
                                if (!node) return
                                clampNodeToViewport(node)
                                transformerRef.current?.getLayer()?.batchDraw()
                            }}
                            onTransformEnd={() => {
                                const node = transformerRef.current?.nodes()[0]
                                if (!node) return
                                const p = node.getAbsolutePosition()
                                const rot = node.rotation()
                                const sX = node.scaleX()
                                const sY = node.scaleY()
                                const s = Math.max(Math.abs((sX + sY) / 2), 0.0001)
                                clampNodeToViewport(node)
                                if (selectedLayer) {
                                    useCanvasStore.getState().updateLayer(selectedLayer.id, { x: p.x, y: p.y, rotation: rot, scale: s })
                                }
                                node.scaleX(1); node.scaleY(1)
                                node.position({ x: p.x, y: p.y })
                                transformerRef.current?.getLayer()?.batchDraw()
                            }}
                        />
                    )}
                </KonvaLayer>
            </Stage>
        </div>
    )
}

type LayerNodeProps = { id: string; isSelected: boolean; stageRef: React.MutableRefObject<Konva.Stage | null>; clampNodeToViewport: (node: Konva.Node) => void; selectedNodeRef: React.MutableRefObject<Konva.Node | null> }

const LayerNode = memo(function LayerNode({ id, isSelected, stageRef, clampNodeToViewport, selectedNodeRef }: LayerNodeProps) {
    const layer = useCanvasStore((s) => s.layers.find((l) => l.id === id), shallow)
    if (!layer) return null
    return (
        <Group
            x={layer.x}
            y={layer.y}
            rotation={layer.rotation}
            scaleX={layer.scale}
            scaleY={layer.scale}
            visible={layer.visible}
            draggable={layer.selected && !layer.locked}
            ref={isSelected ? (node) => { selectedNodeRef.current = node as unknown as Konva.Node } : undefined}
            onClick={() => useCanvasStore.getState().selectLayer(id)}
            onMouseEnter={() => { const stage = stageRef.current; if (stage) stage.container().style.cursor = 'move' }}
            onMouseLeave={() => { const stage = stageRef.current; if (stage) stage.container().style.cursor = 'default' }}
            onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => { clampNodeToViewport(e.target as Konva.Node); (e.target as Konva.Node).getLayer()?.batchDraw() }}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => { const p = (e.target as Konva.Node).position(); useCanvasStore.getState().updateLayer(id, { x: p.x, y: p.y }) }}
        >
            {layer.type === 'raster' && (layer as RasterLayer).image && (
                <KonvaImage image={(layer as RasterLayer).image} width={(layer as RasterLayer).width} height={(layer as RasterLayer).height} />
            )}
            {layer.type === 'text' && (
                <KonvaText text={(layer as TextLayer).text || ''} fontSize={24} fill="#000" />
            )}
            {layer.type === 'vector' && (
                <VectorShape svg={(layer as VectorLayer).svg} />
            )}
        </Group>
    )
}, (a, b) => a.id === b.id && a.isSelected === b.isSelected)

function extractPathData(svg: string): string | null {
    if (!svg) return null
    if (svg.trim().startsWith('<')) {
        try {
            const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
            const path = doc.querySelector('path')
            const d = path?.getAttribute('d')
            return d || null
        } catch {
            return null
        }
    }
    return svg
}

const VectorShape = memo(function VectorShape({ svg }: { svg: string }) {
    const d = extractPathData(svg)
    if (!d) return null
    return <KonvaPath data={d} fill="#000" stroke="#000" strokeWidth={1} />
})
