import type { ReactNode } from 'react'
type Props = { open: boolean; onClose: () => void; children: ReactNode }

export default function Modal({ open, onClose, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 z-60">
        <div className="bg-white rounded-md shadow-lg p-4 min-w-[320px]">{children}</div>
      </div>
    </div>
  )
}
