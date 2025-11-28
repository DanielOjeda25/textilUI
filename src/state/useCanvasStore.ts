import { create } from 'zustand'
import type { ViewportActions, ViewportState } from '../canvas/viewport/viewport.types'
import type { AnyLayer, RasterLayer, VectorLayer, TextLayer } from '../canvas/layers/layer.types'

export interface CanvasStore {
  viewport: ViewportState
  viewportActions: ViewportActions
  layers: AnyLayer[]
  selectedLayerId: string | null
  selectedLayerIds: string[]
  selectionMode: 'intersect' | 'contain'
  setSelectionMode: (mode: 'intersect' | 'contain') => void
  addLayer: (layer: AnyLayer) => void
  removeLayer: (id: string) => void
  selectLayer: (id: string) => void
  toggleSelectLayer: (id: string) => void
  setSelection: (ids: string[]) => void
  clearSelection: () => void
  moveLayer: (id: string, index: number) => void
  updateLayer: (id: string, partial: Partial<AnyLayer>) => void
  resetLayer: (id: string) => void
  resetSelection: () => void
  isLayerAtOriginal: (id: string) => boolean
  toggleVisibility: (id: string) => void
  toggleLocked: (id: string) => void
  setAlphaMap: (id: string, map: { w: number; h: number; data: Uint8Array }) => void
  validateResetLayer: (id: string) => boolean
  validateResetSelection: () => { id: string; ok: boolean }[]
}

const initialViewport: ViewportState = {
  scale: 1,
  minScale: 0.05,
  maxScale: 20,
  x: 0,
  y: 0,
  screenWidth: 0,
  screenHeight: 0,
  contentWidth: 0,
  contentHeight: 0,
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  viewport: initialViewport,
  viewportActions: {
    setScale: (scale: number) => set({ viewport: { ...get().viewport, scale } }),
    setPosition: (x: number, y: number) => set({ viewport: { ...get().viewport, x, y } }),
    fitToScreen: () => { },
    resetView: () => set({ viewport: { ...initialViewport, screenWidth: get().viewport.screenWidth, screenHeight: get().viewport.screenHeight, contentWidth: get().viewport.contentWidth, contentHeight: get().viewport.contentHeight } }),
  },
  layers: [],
  selectedLayerId: null,
  selectedLayerIds: [],
  selectionMode: 'intersect',
  setSelectionMode: (mode: 'intersect' | 'contain') => set({ selectionMode: mode }),
  addLayer: (layer: AnyLayer) => set({
    layers: [
      ...get().layers,
      {
        ...layer,
        selected: false,
        originalX: layer.originalX ?? layer.x,
        originalY: layer.originalY ?? layer.y,
        originalRotation: layer.originalRotation ?? layer.rotation,
        originalScale: layer.originalScale ?? layer.scale,
        ...(layer.type === 'raster'
          ? {
            originalWidth: (layer as RasterLayer).originalWidth ?? (layer as RasterLayer).width,
            originalHeight: (layer as RasterLayer).originalHeight ?? (layer as RasterLayer).height,
          }
          : {}),
      },
    ],
  }),
  removeLayer: (id: string) => set(({ layers, selectedLayerId, selectedLayerIds }) => {
    const next = layers.filter((l) => l.id !== id)
    const nextSelectedId = selectedLayerId === id ? null : selectedLayerId
    const nextSelectedIds = selectedLayerIds.filter((x) => x !== id)
    return { layers: next, selectedLayerId: nextSelectedId, selectedLayerIds: nextSelectedIds }
  }),
  selectLayer: (id: string) => set(({ layers }) => {
    const next = layers.map((l) => ({ ...l, selected: l.id === id }))
    return { layers: next, selectedLayerId: id, selectedLayerIds: [id] }
  }),
  toggleSelectLayer: (id: string) => set(({ layers, selectedLayerIds }) => {
    const exists = selectedLayerIds.includes(id)
    const nextIds = exists ? selectedLayerIds.filter((x) => x !== id) : [...selectedLayerIds, id]
    const nextLayers = layers.map((l) => ({ ...l, selected: nextIds.includes(l.id) }))
    const nextPrimary = nextIds.length ? nextIds[nextIds.length - 1] : null
    return { layers: nextLayers, selectedLayerIds: nextIds, selectedLayerId: nextPrimary }
  }),
  setSelection: (ids: string[]) => set(({ layers }) => {
    const nextLayers = layers.map((l) => ({ ...l, selected: ids.includes(l.id) }))
    const nextPrimary = ids.length ? ids[ids.length - 1] : null
    return { layers: nextLayers, selectedLayerIds: ids, selectedLayerId: nextPrimary }
  }),
  clearSelection: () => set(({ layers }) => ({ layers: layers.map((l) => ({ ...l, selected: false })), selectedLayerIds: [], selectedLayerId: null })),
  moveLayer: (id: string, index: number) => set(({ layers }) => {
    const currentIndex = layers.findIndex((l) => l.id === id)
    if (currentIndex === -1) return { layers }
    const layer = layers[currentIndex]
    if (layer.locked) return { layers }
    const arr = layers.slice()
    arr.splice(currentIndex, 1)
    const clampedIndex = Math.max(0, Math.min(index, arr.length))
    arr.splice(clampedIndex, 0, layer)
    return { layers: arr }
  }),
  updateLayer: (id: string, partial: Partial<AnyLayer>) => set(({ layers }) => {
    const filterKeys = ['originalX', 'originalY', 'originalRotation', 'originalWidth', 'originalHeight', 'originalScale']
    const safe: Record<string, unknown> = { ...partial }
    for (const k of filterKeys) { if (k in safe) delete (safe as { [key: string]: unknown })[k] }
    const next = layers.map((l) => {
      if (l.id !== id) return l
      if (l.locked) return l
      if (l.type === 'raster') return { ...l, ...(safe as Partial<RasterLayer>) }
      if (l.type === 'vector') return { ...l, ...(safe as Partial<VectorLayer>) }
      if (l.type === 'text') return { ...l, ...(safe as Partial<TextLayer>) }
      return l
    })
    return { layers: next }
  }),
  resetLayer: (id: string) => set(({ layers }) => {
    const next = layers.map((l) => {
      if (l.id !== id) return l
      if (l.locked) return l
      const baseX = l.originalX ?? 0
      const baseY = l.originalY ?? 0
      const baseRot = l.originalRotation ?? 0
      if (l.type === 'raster') {
        const rw = (l as RasterLayer).originalWidth ?? (l as RasterLayer).width
        const rh = (l as RasterLayer).originalHeight ?? (l as RasterLayer).height
        return { ...l, x: baseX, y: baseY, rotation: baseRot, width: rw, height: rh, scale: 1 }
      }
      const os = l.originalScale ?? 1
      return { ...l, x: baseX, y: baseY, rotation: baseRot, scale: os }
    })
    return { layers: next }
  }),
  resetSelection: () => set(({ layers, selectedLayerIds }) => {
    const ids = selectedLayerIds
    const idSet = new Set(ids)
    const next = layers.map((l) => {
      if (!idSet.has(l.id)) return l
      if (l.locked) return l
      const baseX = l.originalX ?? 0
      const baseY = l.originalY ?? 0
      const baseRot = l.originalRotation ?? 0
      if (l.type === 'raster') {
        const rw = (l as RasterLayer).originalWidth ?? (l as RasterLayer).width
        const rh = (l as RasterLayer).originalHeight ?? (l as RasterLayer).height
        return { ...l, x: baseX, y: baseY, rotation: baseRot, width: rw, height: rh, scale: 1 }
      }
      const os = l.originalScale ?? 1
      return { ...l, x: baseX, y: baseY, rotation: baseRot, scale: os }
    })
    return { layers: next }
  }),
  isLayerAtOriginal: (id: string) => {
    const l = get().layers.find((x) => x.id === id)
    if (!l) return false
    const baseX = l.originalX ?? 0
    const baseY = l.originalY ?? 0
    const baseRot = l.originalRotation ?? 0
    if (l.type === 'raster') {
      const rw = (l as RasterLayer).originalWidth ?? (l as RasterLayer).width
      const rh = (l as RasterLayer).originalHeight ?? (l as RasterLayer).height
      return l.x === baseX && l.y === baseY && l.rotation === baseRot && (l as RasterLayer).width === rw && (l as RasterLayer).height === rh && l.scale === 1
    }
    const os = l.originalScale ?? 1
    return l.x === baseX && l.y === baseY && l.rotation === baseRot && l.scale === os
  },
  toggleVisibility: (id: string) => set(({ layers }) => ({
    layers: layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
  })),
  toggleLocked: (id: string) => set(({ layers }) => ({
    layers: layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
  })),
  setAlphaMap: (id: string, map: { w: number; h: number; data: Uint8Array }) => set(({ layers }) => ({
    layers: layers.map((l) => (l.id === id && l.type === 'raster' ? { ...l, alphaMap: map } : l)),
  })),
  validateResetLayer: (id: string) => {
    const prevLayers = get().layers
    const l = prevLayers.find((x) => x.id === id)
    if (!l) return false
    const mutated = prevLayers.map((x) => {
      if (x.id !== id) return x
      if (x.type === 'raster') return { ...x, x: x.x + 13, y: x.y - 7, rotation: x.rotation + 0.37, width: (x as RasterLayer).width + 9, height: (x as RasterLayer).height + 11, scale: Math.max(0.1, Math.min(5, x.scale * 1.23)) }
      return { ...x, x: x.x + 13, y: x.y - 7, rotation: x.rotation + 0.37, scale: Math.max(0.1, Math.min(5, x.scale * 1.23)) }
    })
    set({ layers: mutated })
    get().resetLayer(id)
    const ok = get().isLayerAtOriginal(id)
    set({ layers: prevLayers })
    return ok
  },
  validateResetSelection: () => {
    const prevLayers = get().layers
    const ids = get().selectedLayerIds
    const idSet = new Set(ids)
    if (!ids.length) return []
    const mutated = prevLayers.map((x) => {
      if (!idSet.has(x.id)) return x
      if (x.type === 'raster') return { ...x, x: x.x + 8, y: x.y + 12, rotation: x.rotation - 0.51, width: (x as RasterLayer).width + 5, height: (x as RasterLayer).height + 4, scale: Math.max(0.1, Math.min(5, x.scale * 0.77)) }
      return { ...x, x: x.x + 8, y: x.y + 12, rotation: x.rotation - 0.51, scale: Math.max(0.1, Math.min(5, x.scale * 0.77)) }
    })
    set({ layers: mutated })
    get().resetSelection()
    const results = ids.map((i) => ({ id: i, ok: get().isLayerAtOriginal(i) }))
    set({ layers: prevLayers })
    return results
  },
}))
