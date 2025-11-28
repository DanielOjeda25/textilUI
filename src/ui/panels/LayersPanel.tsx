import { useCanvasStore } from '../../state/useCanvasStore'
import LayerItem from './LayerItem'

export default function LayersPanel() {
  const layers = useCanvasStore((s) => s.layers)

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-neutral-900 scrollbar-thin">
      <div className="flex items-center gap-2 px-2 py-2 border-b border-neutral-800">
        <span className="text-xs text-neutral-300">Capas</span>
      </div>
      {layers.map((l) => (
        <LayerItem key={l.id} layer={l} />
      ))}
    </div>
  )
}
