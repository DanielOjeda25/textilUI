import { useState } from 'react'
import type { CanvasState } from '../canvas/types/canvas.types'

export function useCanvasStore() {
  const [state, setState] = useState<CanvasState>({
    layers: [],
    viewport: { x: 0, y: 0, scale: 1 },
  })
  return { state, setState }
}
