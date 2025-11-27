import { useToolStore } from '../../state/useToolStore'
import { Move, MousePointer, RotateCcw, Type, Upload } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = { onOpenImport?: () => void; onOpenText?: () => void }
export default function Toolbar({ onOpenImport, onOpenText }: Props) {
  const active = useToolStore((s) => s.activeTool)
  const setActiveTool = useToolStore((s) => s.setActiveTool)
  const btn = (label: string, icon: ReactNode, tool: 'select' | 'move' | 'transform' | 'text') => (
    <button
      className={`flex items-center gap-1 px-3 py-2 ${active === tool ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200'}`}
      onClick={() => setActiveTool(tool)}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-neutral-900">
      <button className="flex items-center gap-1 px-3 py-2 bg-neutral-700 text-white" onClick={onOpenImport}>
        <Upload size={16} />
        <span>Import</span>
      </button>
      {btn('Select', <MousePointer size={16} />, 'select')}
      {btn('Move', <Move size={16} />, 'move')}
      {btn('Transform', <RotateCcw size={16} />, 'transform')}
      <button className={`flex items-center gap-1 px-3 py-2 ${active === 'text' ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-200'}`} onClick={() => onOpenText ? onOpenText() : setActiveTool('text')}>
        <Type size={16} />
        <span>Text</span>
      </button>
    </div>
  )
}
