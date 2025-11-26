import { useEffect, useMemo } from 'react'
import { useCanvasStore } from '../../state/useCanvasStore'
import { ViewportController } from './ViewportController'

export interface TransformMatrix {
  a: number
  d: number
  tx: number
  ty: number
}

export function useViewport() {
  const viewport = useCanvasStore((s) => s.viewport)

  const controller = useMemo(() => new ViewportController({ limits: true }), [])

  useEffect(() => {
    /* screen size managed externally */
  }, [controller])

  useEffect(() => {
    useCanvasStore.setState({
      viewportActions: {
        setScale: (scale: number, cx?: number, cy?: number) => controller.setScale(scale, cx, cy),
        setPosition: (x: number, y: number) => controller.setPosition(x, y),
        fitToScreen: () => controller.fitToScreen(),
        resetView: () => controller.resetView(),
      },
    })
  }, [controller])

  const matrix: TransformMatrix = { a: viewport.scale, d: viewport.scale, tx: viewport.x, ty: viewport.y }

  function toScreen(x: number, y: number) {
    return controller.worldToScreen(x, y)
  }

  function toWorld(x: number, y: number) {
    return controller.screenToWorld(x, y)
  }

  return { viewport, controller, matrix, toScreen, toWorld }
}
