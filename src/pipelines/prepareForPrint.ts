export function prepareForPrint(data: Blob | ArrayBuffer): Blob {
  if (data instanceof Blob) return data
  return new Blob([data], { type: 'application/octet-stream' })
}
