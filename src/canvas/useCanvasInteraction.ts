import { useEffect, useRef } from 'react'

export function useCanvasInteraction() {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {}, [])
  return { ref }
}
