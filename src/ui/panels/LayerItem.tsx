import { useState } from 'react'
import { useCanvasStore } from '../../state/useCanvasStore'
import type { AnyLayer } from '../../canvas/layers/layer.types'
import { Eye, EyeOff, Lock, Unlock, GripVertical, Image as ImageIcon, Square, Type } from 'lucide-react'

type Props = { layer: AnyLayer }
export default function LayerItem({ layer }: Props) {
  const selectLayer = useCanvasStore((s) => s.selectLayer)
  const toggleVisibility = useCanvasStore((s) => s.toggleVisibility)
  const toggleLocked = useCanvasStore((s) => s.toggleLocked)
  const updateLayer = useCanvasStore((s) => s.updateLayer)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(layer.name)

  const selected = layer.selected

  function commitRename() {
    const next = name.trim()
    if (next.length === 0) { setName(layer.name); setEditing(false); return }
    updateLayer(layer.id, { name: next })
    setEditing(false)
  }

  function iconForLayer() {
    if (layer.type === 'raster') return <ImageIcon size={16} />
    if (layer.type === 'vector') return <Square size={16} />
    return <Type size={16} />
  }

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer ${selected ? 'bg-blue-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'}`}
      onClick={() => selectLayer(layer.id)}
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
    >
      <span className="w-4 h-4 flex items-center justify-center text-neutral-300">{iconForLayer()}</span>
      <span className="w-4 h-4 ml-1 text-neutral-300"><GripVertical size={16} /></span>
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            className={`w-full bg-neutral-700 rounded px-1 py-0.5 outline-none ${selected ? 'text-white' : 'text-neutral-100'}`}
            value={name}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitRename() }
              else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); setName(layer.name) }
            }}
          />
        ) : (
          <span className="truncate select-none">{layer.name}</span>
        )}
      </div>
      <button
        className="px-2 h-6 flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id) }}
        aria-label={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
        title={layer.visible ? 'Ocultar' : 'Mostrar'}
      >
        {layer.visible ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <button
        className="px-2 h-6 flex items-center justify-center"
        onClick={(e) => { e.stopPropagation(); toggleLocked(layer.id) }}
        aria-label={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'}
        title={layer.locked ? 'Desbloquear' : 'Bloquear'}
      >
        {layer.locked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>
    </div>
  )
}
