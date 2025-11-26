import { create } from 'zustand'
import type { ViewportActions, ViewportState } from '../canvas/viewport/viewport.types'
import type { AnyLayer, RasterLayer, VectorLayer, TextLayer } from '../canvas/layers/layer.types'

export interface CanvasStore {
  viewport: ViewportState
  viewportActions: ViewportActions
  layers: AnyLayer[]
  selectedLayerId: string | null
  addLayer: (layer: AnyLayer) => void
  removeLayer: (id: string) => void
  selectLayer: (id: string) => void
  moveLayer: (id: string, index: number) => void
  updateLayer: (id: string, partial: Partial<AnyLayer>) => void
  toggleVisibility: (id: string) => void
  toggleLocked: (id: string) => void
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
  addLayer: (layer: AnyLayer) => set({
    layers: [...get().layers, { ...layer, selected: false }],
  }),
  removeLayer: (id: string) => set(({ layers, selectedLayerId }) => {
    const next = layers.filter((l) => l.id !== id)
    const nextSelected = selectedLayerId === id ? null : selectedLayerId
    return { layers: next, selectedLayerId: nextSelected }
  }),
  selectLayer: (id: string) => set(({ layers }) => {
    const next = layers.map((l) => ({ ...l, selected: l.id === id }))
    return { layers: next, selectedLayerId: id }
  }),
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
    const next = layers.map((l) => {
      if (l.id !== id) return l
      if (l.locked) return l
      if (l.type === 'raster') return { ...l, ...(partial as Partial<RasterLayer>) }
      if (l.type === 'vector') return { ...l, ...(partial as Partial<VectorLayer>) }
      if (l.type === 'text') return { ...l, ...(partial as Partial<TextLayer>) }
      return l
    })
    return { layers: next }
  }),
  toggleVisibility: (id: string) => set(({ layers }) => ({
    layers: layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
  })),
  toggleLocked: (id: string) => set(({ layers }) => ({
    layers: layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
  })),
}))
