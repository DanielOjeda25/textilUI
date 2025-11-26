import { useRef } from 'react'

export function useDrag() {
  const pos = useRef({ x: 0, y: 0 })
  function start(x: number, y: number) {
    pos.current = { x, y }
  }
  function move(x: number, y: number) {
    pos.current = { x, y }
  }
  function end() {}
  return { pos, start, move, end }
}
