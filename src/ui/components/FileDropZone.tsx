import type { ChangeEvent } from 'react'

type Props = { onFiles: (files: FileList) => void }

export default function FileDropZone({ onFiles }: Props) {
  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) onFiles(e.target.files)
  }
  return <input type="file" multiple onChange={onChange} />
}
