import { create } from 'zustand'
import type { ViewportActions, ViewportState } from '../canvas/viewport/viewport.types'

export interface CanvasStore {
  viewport: ViewportState
  viewportActions: ViewportActions
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
    fitToScreen: () => {},
    resetView: () => set({ viewport: { ...initialViewport, screenWidth: get().viewport.screenWidth, screenHeight: get().viewport.screenHeight, contentWidth: get().viewport.contentWidth, contentHeight: get().viewport.contentHeight } }),
  },
}))
