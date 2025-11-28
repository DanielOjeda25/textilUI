import { useCanvasStore } from '../../state/useCanvasStore'
import LayerItem from './LayerItem'

export default function LayersPanel() {
  const layers = useCanvasStore((s) => s.layers)
  const mode = useCanvasStore((s) => s.selectionMode)
  const setMode = useCanvasStore((s) => s.setSelectionMode)

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto bg-neutral-900 scrollbar-thin">
      <div className="flex items-center gap-2 px-2 py-2 border-b border-neutral-800">
        <span className="text-xs text-neutral-300">Selección:</span>
        <button
          type="button"
          className={`px-2 py-1 rounded text-xs ${mode === 'intersect' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200'}`}
          onClick={() => setMode('intersect')}
          title="Selecciona capas que intersectan el rectángulo"
        >Intersección</button>
        <button
          type="button"
          className={`px-2 py-1 rounded text-xs ${mode === 'contain' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200'}`}
          onClick={() => setMode('contain')}
          title="Selecciona capas completamente contenidas"
        >Contiene todo</button>
      </div>
      {layers.map((l) => (
        <LayerItem key={l.id} layer={l} />
      ))}
    </div>
  )
}
