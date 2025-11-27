import { useRef } from 'react'

type Props = { onFiles: (files: File[]) => void }

export default function FileImporter({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
  }
  function onClick() {
    inputRef.current?.click()
  }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) onFiles(Array.from(e.target.files))
  }
  return (
    <div
      className="border-2 border-dashed border-neutral-400 rounded-md p-6 text-center cursor-pointer select-none"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={onClick}
    >
      <p className="text-sm text-neutral-600">Arrastrá archivos aquí o hacé clic para seleccionar</p>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={onChange} />
    </div>
  )
}

