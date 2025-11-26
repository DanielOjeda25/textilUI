import type { InputHTMLAttributes } from 'react'

export default function Slider(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return <input type="range" {...props} />
}
