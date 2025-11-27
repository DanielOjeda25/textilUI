import { useToolStore } from '../../state/useToolStore'
import { Move, MousePointer, RotateCcw, Type, Upload } from 'lucide-react'
import type { ReactNode } from 'react'

import { useRef } from 'react'
type Props = { onSelectFile: (file: File) => void; onOpenText?: () => void }
export default function Toolbar({ onSelectFile, onOpenText }: Props) {
  const active = useToolStore((s) => s.activeTool)
  const setActiveTool = useToolStore((s) => s.setActiveTool)
  const inputRef = useRef<HTMLInputElement | null>(null)
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
      <button className="flex items-center gap-1 px-3 py-2 bg-neutral-700 text-white" type="button" onClick={() => inputRef.current?.click()}>
        <Upload size={16} />
        <span>Importar imagen</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelectFile(f); if (inputRef.current) inputRef.current.value = '' }} />
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
