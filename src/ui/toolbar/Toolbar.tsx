import { useToolStore } from '../../state/useToolStore'
import { Move, MousePointer, RotateCcw, Type } from 'lucide-react'
import type { ReactNode } from 'react'

export default function Toolbar() {
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
    <div className="flex gap-2 p-2 border-b border-neutral-700 bg-neutral-900">
      {btn('Select', <MousePointer size={16} />, 'select')}
      {btn('Move', <Move size={16} />, 'move')}
      {btn('Transform', <RotateCcw size={16} />, 'transform')}
      {btn('Text', <Type size={16} />, 'text')}
    </div>
  )
}
