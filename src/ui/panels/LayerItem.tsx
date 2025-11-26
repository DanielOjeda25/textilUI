import { useCanvasStore } from '../../state/useCanvasStore'
import type { AnyLayer } from '../../canvas/layers/layer.types'

type Props = { layer: AnyLayer }
export default function LayerItem({ layer }: Props) {
  const toggleVisibility = useCanvasStore((s) => s.toggleVisibility)
  const toggleLocked = useCanvasStore((s) => s.toggleLocked)
  const selectLayer = useCanvasStore((s) => s.selectLayer)

  const icon = layer.type === 'raster' ? '🖼️' : layer.type === 'vector' ? '🔷' : '🔤'
  const selected = layer.selected

  return (
    <div className={`flex items-center gap-2 px-2 py-1 cursor-pointer ${selected ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200'}`} onClick={() => selectLayer(layer.id)}>
      <span className="w-5 text-center">{icon}</span>
      <span className="flex-1 truncate">{layer.name}</span>
      <button className="px-2" onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id) }}>{layer.visible ? '👁️' : '🚫'}</button>
      <button className="px-2" onClick={(e) => { e.stopPropagation(); toggleLocked(layer.id) }}>{layer.locked ? '🔒' : '🔓'}</button>
      <span className="px-2">⋮⋮</span>
    </div>
  )
}

