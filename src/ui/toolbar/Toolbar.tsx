// FILE: src/ui/toolbar/Toolbar.tsx
import { Crop, Eraser, Wand2, Pipette, Type } from 'lucide-react'
import type { ReactNode } from 'react'
import { useToolStore } from '../../state/useToolStore'
// import { useCanvasStore } from '../../state/useCanvasStore'

type ToolId =
  | 'select'
  | 'move'
  | 'transform'
  | 'crop'
  | 'eraser'
  | 'magic'
  | 'color'
  | 'text'

type Props = { onSelectFile?: (file: File) => void; onOpenText?: () => void }

function ToolbarButton({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  const activeClass = active ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200'
  return (
    <button type="button" role="button" aria-pressed={active} className={`flex items-center gap-1 px-3 py-2 rounded ${activeClass}`} onClick={onClick}>
      {icon} {label}
    </button>
  )
}

export default function Toolbar({ onOpenText }: Props) {
  const active = useToolStore((s) => s.activeTool as ToolId)
  const setActiveToolStore = useToolStore(
    (s) => s.setActiveTool as (t: ToolId) => void,
  )

  function setActive(tool: ToolId) { setActiveToolStore(tool) }

  function btnProps(tool: ToolId) {
    return {
      active: active === tool,
      onClick: () => {
        if (tool === 'crop' || tool === 'eraser' || tool === 'magic' || tool === 'color') {
          alert('Función en desarrollo')
          return
        }
        setActive(tool)
      },
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-neutral-900 border-b border-neutral-700">
      {/* Manipulación directa: Select/Move/Transform removidos */}
      <ToolbarButton label="Crop" icon={<Crop size={18} />} {...btnProps('crop')} />
      <ToolbarButton label="Eraser" icon={<Eraser size={18} />} {...btnProps('eraser')} />
      <ToolbarButton label="Magic" icon={<Wand2 size={18} />} {...btnProps('magic')} />
      <ToolbarButton label="Color" icon={<Pipette size={18} />} {...btnProps('color')} />

      <button
        type="button"
        role="button"
        aria-pressed={active === 'text'}
        className={`flex items-center gap-1 px-3 py-2 rounded ${active === 'text'
          ? 'bg-blue-600 text-white'
          : 'bg-neutral-800 text-neutral-200'
          }`}
        onClick={() => (onOpenText ? onOpenText() : setActive('text'))}
      >
        <Type size={18} />
        Text
      </button>
    </div>
  )
}
