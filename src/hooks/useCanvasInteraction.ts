import { useEffect, useRef } from 'react'
import type { ViewportController } from '../canvas/viewport/ViewportController'
import { useShortcut } from './useShortcut'

export function useCanvasInteraction(controller: ViewportController) {
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

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
    function onDown(e: MouseEvent) {
      dragging.current = true
      last.current = { x: e.clientX, y: e.clientY }
    }
    function onMove(e: MouseEvent) {
      if (!dragging.current) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      controller.panBy(dx, dy)
    }
    function onUp() {
      dragging.current = false
    }
    function onDbl() {
      controller.fitToScreen()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('dblclick', onDbl)
    return () => {
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('dblclick', onDbl)
    }
  }, [controller])

  function reset() {
    controller.resetView()
  }

  useShortcut(['Ctrl', '0'], reset)

  return { reset }
}
