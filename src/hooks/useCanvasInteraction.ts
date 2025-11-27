import { useEffect, useMemo, useRef, useState } from 'react'
import type { ViewportController } from '../canvas/viewport/ViewportController'
import { useShortcut } from './useShortcut'
import { ToolController } from '../canvas/tools/ToolController'
import { useCanvasStore } from '../state/useCanvasStore'
import { detectHandle, isWithinLayer, getBounds } from '../canvas/tools/handle.utils'
import { HANDLE_HIT_RADIUS_SCREEN } from '../canvas/tools/handle.utils'

export function useCanvasInteraction(controller: ViewportController) {
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [spaceDown, setSpaceDown] = useState(false)
  const tools = useMemo(() => new ToolController(controller), [controller])

  useEffect(() => {
    const view = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!view) return
    const canvas = view as HTMLCanvasElement
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const world = controller.screenToWorld(cx, cy)
      const { layers, selectedLayerId } = useCanvasStore.getState()
      const layer = layers.find((l) => l.id === selectedLayerId)
      if (layer && isWithinLayer(world, layer)) {
        const b = getBounds(layer)
        const centerLocal = { x: (b.width * layer.scale) / 2, y: (b.height * layer.scale) / 2 }
        const centerWorld = { x: layer.x + (Math.cos(layer.rotation) * centerLocal.x - Math.sin(layer.rotation) * centerLocal.y), y: layer.y + (Math.sin(layer.rotation) * centerLocal.x + Math.cos(layer.rotation) * centerLocal.y) }
        const c = controller.worldToScreen(centerWorld.x, centerWorld.y)
        controller.zoomAt(e.deltaY, c.x, c.y)
      } else {
        controller.zoomAt(e.deltaY, cx, cy)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space') setSpaceDown(true)
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') setSpaceDown(false)
    }
    function onDbl() {
      controller.fitToScreen()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('dblclick', onDbl)
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('dblclick', onDbl)
    }
  }, [controller])

  function reset() {
    controller.resetView()
  }

  useShortcut(['Ctrl', '0'], reset)

  function onPointerDown(e: PointerEvent) {
    if (spaceDown) {
      dragging.current = true
      last.current = { x: e.clientX, y: e.clientY }
      return
    }
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas && typeof e.pointerId === 'number') {
      // Captura el puntero para mantener los eventos durante el drag aunque salga del canvas
      try { canvas.setPointerCapture(e.pointerId) } catch { void 0 }
    }
    tools.onPointerDown(e)
  }
  function onPointerMove(e: PointerEvent) {
    if (dragging.current && spaceDown) {
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      controller.panBy(dx, dy)
      return
    }
    // Feedback de cursor según handle bajo el puntero
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const p = controller.screenToWorld(sx, sy)
      const { viewport, layers, selectedLayerId } = useCanvasStore.getState()
      const layer = layers.find((l) => l.id === selectedLayerId)
      if (layer) {
        const h = detectHandle(p, layer, viewport.scale, HANDLE_HIT_RADIUS_SCREEN)
        let cursor: string = 'default'
        if (h.kind === 'rotate') {
          cursor = (e.buttons & 1) ? 'grabbing' : 'grab'
        } else if (h.kind === 'corner') {
          cursor = 'nwse-resize'
        } else if (h.kind === 'side') {
          // Índices: 0=lado superior, 1=derecho, 2=inferior, 3=izquierdo
          cursor = h.index === 0 || h.index === 2 ? 'ns-resize' : 'ew-resize'
        }
        canvas.style.cursor = cursor
      } else {
        canvas.style.cursor = 'default'
      }
    }
    tools.onPointerMove(e)
  }
  function onPointerUp(e: PointerEvent) {
    if (dragging.current) dragging.current = false
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas && typeof e.pointerId === 'number') {
      // Liberar la captura de puntero al finalizar el drag
      try { canvas.releasePointerCapture(e.pointerId) } catch { void 0 }
    }
    tools.onPointerUp(e)
  }

  return { reset, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
