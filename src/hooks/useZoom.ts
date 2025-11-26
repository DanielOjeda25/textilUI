import { useState } from 'react'

export function useZoom(initial = 1) {
  const [zoom, setZoom] = useState(initial)
  function zoomIn(step = 0.1) {
    setZoom((z) => z + step)
  }
  function zoomOut(step = 0.1) {
    setZoom((z) => z - step)
  }
  function reset() {
    setZoom(initial)
  }
  return { zoom, zoomIn, zoomOut, reset }
}
