import { useEffect, useMemo, useRef, useState } from 'react'
import type { ViewportController } from '../canvas/viewport/ViewportController'
import { useShortcut } from './useShortcut'
import { ToolController } from '../canvas/tools/ToolController'

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
      controller.zoomAt(e.deltaY, cx, cy)
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
    tools.onPointerMove(e)
  }
  function onPointerUp(e: PointerEvent) {
    if (dragging.current) dragging.current = false
    tools.onPointerUp(e)
  }

  return { reset, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
