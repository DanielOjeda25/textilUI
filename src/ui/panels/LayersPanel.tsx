import { useCanvasStore } from '../../state/useCanvasStore'
import LayerItem from './LayerItem'

export default function LayersPanel() {
  const layers = useCanvasStore((s) => s.layers)

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-neutral-900 scrollbar-thin">
      {layers.map((l) => (
        <LayerItem key={l.id} layer={l} />
      ))}
    </div>
  )
}
