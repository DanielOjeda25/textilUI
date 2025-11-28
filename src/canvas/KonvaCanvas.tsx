import { Stage, Layer as KonvaLayer, Image as KonvaImage, Text as KonvaText, Group, Transformer, Path as KonvaPath } from 'react-konva'
import type Konva from 'konva'
import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { useCanvasStore } from '../state/useCanvasStore'
import type { RasterLayer, TextLayer, VectorLayer } from './layers/layer.types'
import { shallow } from 'zustand/shallow'

export type KonvaCanvasProps = { width: number; height: number }

export default function KonvaCanvas({ width, height }: KonvaCanvasProps) {
    const viewport = useCanvasStore((s) => s.viewport, shallow)
    useCanvasStore((s) => s.selectedLayerId)
    const selectedIds = useCanvasStore((s) => s.selectedLayerIds, shallow)
    const layerIds = useCanvasStore((s) => s.layers.map((l) => l.id), shallow)
    const selectedLayer = useCanvasStore((s) => s.layers.find((l) => l.id === s.selectedLayerId) || null)
    const layersAll = useCanvasStore((s) => s.layers, shallow)
    const stageRef = useRef<Konva.Stage | null>(null)
    const transformerRef = useRef<Konva.Transformer | null>(null)
    const selectedNodeRef = useRef<Konva.Node | null>(null)
    const allNodesRef = useRef<Map<string, Konva.Node>>(new Map())
    const [spaceDown, setSpaceDown] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [menu, setMenu] = useState<{ open: boolean; x: number; y: number; layerId: string | null }>({ open: false, x: 0, y: 0, layerId: null })
    const lastDrawRef = useRef<number>(0)
    const scheduledRef = useRef<boolean>(false)
    const selStartRef = useRef<{ x: number; y: number } | null>(null)
    const [selRect, setSelRect] = useState<{ active: boolean; x: number; y: number; w: number; h: number }>({ active: false, x: 0, y: 0, w: 0, h: 0 })

    const scheduleDraw = useCallback((layer?: Konva.Layer | null) => {
        const l = layer ?? transformerRef.current?.getLayer() ?? stageRef.current?.getLayers()[0]
        if (!l) return
        const now = performance.now()
        const elapsed = now - lastDrawRef.current
        const interval = 33
        if (elapsed >= interval) {
            l.batchDraw()
            lastDrawRef.current = now
            scheduledRef.current = false
        } else if (!scheduledRef.current) {
            scheduledRef.current = true
            const wait = interval - elapsed
            setTimeout(() => {
                l.batchDraw()
                lastDrawRef.current = performance.now()
                scheduledRef.current = false
            }, wait)
        }
    }, [])

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

    const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
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
        let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
        newScale = Math.min(5, Math.max(0.1, newScale))
        stage.scale({ x: newScale, y: newScale })
        const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale }
        stage.position(newPos)
        useCanvasStore.setState((s) => ({ ...s, viewport: { ...s.viewport, scale: newScale, x: newPos.x, y: newPos.y, screenWidth: width, screenHeight: height } }))
    }, [width, height])

    const onDragMoveStage = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        const stage = (e.target as Konva.Stage | Konva.Node).getStage() as Konva.Stage
        const pos = stage.position()
        useCanvasStore.setState((s) => ({ ...s, viewport: { ...s.viewport, x: pos.x, y: pos.y } }))
    }, [])

    const clampNodeToViewport = useCallback((node: Konva.Node) => {
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
    }, [])

    useEffect(() => {
        const tr = transformerRef.current
        if (!tr) return
        const nodes: Konva.Node[] = []
        for (const id of selectedIds) {
            const l = layersAll.find((x) => x.id === id)
            if (!l || !l.visible || l.locked) continue
            const n = allNodesRef.current.get(id)
            if (n) nodes.push(n)
        }
        tr.nodes(nodes)
        scheduleDraw(tr.getLayer())
    }, [selectedIds, layersAll, scheduleDraw])

    const baseDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const pixelRatio = Math.min(baseDpr, Math.max(1, viewport.scale))

    const openContextMenu = useCallback((layerId: string, clientX: number, clientY: number) => {
        const c = containerRef.current
        if (!c) return
        const rect = c.getBoundingClientRect()
        setMenu({ open: true, x: clientX - rect.left, y: clientY - rect.top, layerId })
    }, [])

    const closeMenu = useCallback(() => setMenu((m) => ({ ...m, open: false, layerId: null })), [])

    const onResetScale = useCallback(() => {
        if (!menu.layerId) return
        const ids = useCanvasStore.getState().selectedLayerIds.length > 1 ? useCanvasStore.getState().selectedLayerIds : [menu.layerId]
        for (const id of ids) {
            const l = layersAll.find((x) => x.id === id)
            if (!l) continue
            const baseX = l.originalX ?? 0
            const baseY = l.originalY ?? 0
            const baseRot = l.originalRotation ?? 0
            if (l.type === 'raster') {
                const rw = (l as RasterLayer).originalWidth ?? (l as RasterLayer).width
                const rh = (l as RasterLayer).originalHeight ?? (l as RasterLayer).height
                useCanvasStore.getState().updateLayer(l.id, { x: baseX, y: baseY, rotation: baseRot, width: rw, height: rh, scale: 1 })
            } else {
                useCanvasStore.getState().updateLayer(l.id, { x: baseX, y: baseY, rotation: baseRot, scale: 1 })
            }
        }
        closeMenu()
    }, [menu.layerId, layersAll, closeMenu])

    const onResetZoom = useCallback(() => {
        const centerPos = { x: 0, y: 0 }
        useCanvasStore.setState((prev) => ({ ...prev, viewport: { ...prev.viewport, scale: 1, x: centerPos.x, y: centerPos.y } }))
        const stage = stageRef.current
        if (stage) { stage.scale({ x: 1, y: 1 }); stage.position(centerPos) }
        closeMenu()
    }, [closeMenu])

    return (
        <div ref={containerRef} style={{ width, height }} className="relative h-full w-full">
            <Stage ref={stageRef} width={width} height={height} draggable={spaceDown} x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale} pixelRatio={pixelRatio} onWheel={onWheel} onDragMove={onDragMoveStage}
                onMouseDown={(e) => {
                    if (spaceDown) return
                    const targetClass = (e.target as unknown as { className?: string }).className
                    if (targetClass !== 'Stage') return
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const sx = (e.evt as MouseEvent).clientX - rect.left
                    const sy = (e.evt as MouseEvent).clientY - rect.top
                    selStartRef.current = { x: sx, y: sy }
                    setSelRect({ active: true, x: sx, y: sy, w: 0, h: 0 })
                }}
                onMouseMove={(e) => {
                    if (!selStartRef.current || !selRect.active) return
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const sx = (e.evt as MouseEvent).clientX - rect.left
                    const sy = (e.evt as MouseEvent).clientY - rect.top
                    const x0 = selStartRef.current.x
                    const y0 = selStartRef.current.y
                    const nx = Math.min(x0, sx)
                    const ny = Math.min(y0, sy)
                    const nw = Math.abs(sx - x0)
                    const nh = Math.abs(sy - y0)
                    setSelRect({ active: true, x: nx, y: ny, w: nw, h: nh })
                }}
                onMouseUp={(e) => {
                    if (!selRect.active) return
                    const additive = (e.evt as MouseEvent).ctrlKey || (e.evt as MouseEvent).metaKey
                    const rx = selRect.x
                    const ry = selRect.y
                    const rw = selRect.w
                    const rh = selRect.h
                    const selected: string[] = []
                    for (const [id, node] of allNodesRef.current.entries()) {
                        const l = layersAll.find((x) => x.id === id)
                        if (!l || !l.visible || l.locked) continue
                        const r = node.getClientRect({ skipShadow: true, skipStroke: true })
                        const intersects = !(r.x > rx + rw || r.x + r.width < rx || r.y > ry + rh || r.y + r.height < ry)
                        if (intersects) selected.push(id)
                    }
                    if (selected.length) {
                        if (additive) {
                            const prev = useCanvasStore.getState().selectedLayerIds
                            const merged = Array.from(new Set([...prev, ...selected]))
                            useCanvasStore.getState().setSelection(merged)
                        } else {
                            useCanvasStore.getState().setSelection(selected)
                        }
                    } else if (!additive) {
                        useCanvasStore.getState().clearSelection()
                    }
                    selStartRef.current = null
                    setSelRect({ active: false, x: 0, y: 0, w: 0, h: 0 })
                }}
            >

                <KonvaLayer>
                    {layerIds.map((id) => (
                        <LayerNode
                            key={id}
                            id={id}
                            isSelected={selectedIds.includes(id)}
                            stageRef={stageRef}
                            clampNodeToViewport={clampNodeToViewport}
                            selectedNodeRef={selectedNodeRef}
                            scheduleDraw={scheduleDraw}
                            registerNode={(id: string, node: Konva.Node | null) => { if (node) allNodesRef.current.set(id, node); else allNodesRef.current.delete(id) }}
                            openContextMenu={openContextMenu}
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
                                const sx = Math.min(5, Math.max(0.1, node.scaleX()))
                                const sy = Math.min(5, Math.max(0.1, node.scaleY()))
                                node.scaleX(sx)
                                node.scaleY(sy)
                                clampNodeToViewport(node)
                                scheduleDraw(transformerRef.current?.getLayer() ?? null)
                            }}
                            onTransformEnd={() => {
                                const nodes = transformerRef.current?.nodes() || []
                                for (const n of nodes) {
                                    const id = [...allNodesRef.current.entries()].find(([, node]) => node === n)?.[0]
                                    if (!id) continue
                                    const l = layersAll.find((x) => x.id === id)
                                    if (!l) continue
                                    const p = n.getAbsolutePosition()
                                    const rot = n.rotation()
                                    const sX = Math.min(5, Math.max(0.1, n.scaleX()))
                                    const sY = Math.min(5, Math.max(0.1, n.scaleY()))
                                    clampNodeToViewport(n)
                                    if (l.type === 'raster') {
                                        const base = l as RasterLayer
                                        const minW = 10
                                        const minH = 10
                                        const nextW = Math.max(minW, Math.round(base.width * sX))
                                        const nextH = Math.max(minH, Math.round(base.height * sY))
                                        useCanvasStore.getState().updateLayer(base.id, { x: p.x, y: p.y, rotation: rot, width: nextW, height: nextH, scale: 1 })
                                    } else {
                                        const s = Math.max(0.1, Math.min(5, Math.abs((sX + sY) / 2)))
                                        useCanvasStore.getState().updateLayer(l.id, { x: p.x, y: p.y, rotation: rot, scale: s })
                                    }
                                    n.scaleX(1); n.scaleY(1)
                                    n.position({ x: p.x, y: p.y })
                                }
                                scheduleDraw(transformerRef.current?.getLayer() ?? null)
                            }}
                        />
                    )}
                </KonvaLayer>
            </Stage>
            {selRect.active && (
                <div style={{ position: 'absolute', left: selRect.x, top: selRect.y, width: selRect.w, height: selRect.h }} className="pointer-events-none z-40 border border-blue-500/70 bg-blue-500/10" />
            )}
            {menu.open && (
                <div style={{ position: 'absolute', left: menu.x, top: menu.y }} className="z-50 rounded-md border border-neutral-300 bg-white shadow-lg">
                    <button className="block w-40 px-3 py-2 text-left hover:bg-neutral-100" onClick={onResetScale}>Resetear escala</button>
                    <button className="block w-40 px-3 py-2 text-left hover:bg-neutral-100" onClick={onResetZoom}>Resetear zoom global</button>
                </div>
            )}
            {menu.open && (
                <div className="absolute inset-0 z-40" onClick={closeMenu} />
            )}
        </div>
    )
}

type LayerNodeProps = { id: string; isSelected: boolean; stageRef: React.MutableRefObject<Konva.Stage | null>; clampNodeToViewport: (node: Konva.Node) => void; selectedNodeRef: React.MutableRefObject<Konva.Node | null>; scheduleDraw: (layer?: Konva.Layer | null) => void; registerNode: (id: string, node: Konva.Node | null) => void; openContextMenu: (layerId: string, clientX: number, clientY: number) => void }

const LayerNode = memo(function LayerNode({ id, isSelected, stageRef, clampNodeToViewport, selectedNodeRef, scheduleDraw, registerNode, openContextMenu }: LayerNodeProps) {
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
            ref={(node) => { registerNode(id, node as unknown as Konva.Node | null); if (isSelected && node) selectedNodeRef.current = node as unknown as Konva.Node }}
            onClick={(e) => { const additive = (e.evt as MouseEvent).ctrlKey || (e.evt as MouseEvent).metaKey; if (additive) useCanvasStore.getState().toggleSelectLayer(id); else useCanvasStore.getState().selectLayer(id) }}
            onMouseEnter={() => { const stage = stageRef.current; if (stage) stage.container().style.cursor = 'move' }}
            onMouseLeave={() => { const stage = stageRef.current; if (stage) stage.container().style.cursor = 'default' }}
            onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => { clampNodeToViewport(e.target as Konva.Node); scheduleDraw((e.target as Konva.Node).getLayer()) }}
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => { const p = (e.target as Konva.Node).position(); useCanvasStore.getState().updateLayer(id, { x: p.x, y: p.y }) }}
            onContextMenu={(e: Konva.KonvaEventObject<PointerEvent>) => {
                e.evt.preventDefault()
                if (layer.visible && !layer.locked) {
                    useCanvasStore.getState().selectLayer(id)
                    openContextMenu(id, (e.evt as MouseEvent).clientX, (e.evt as MouseEvent).clientY)
                }
            }}
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
