export async function loadPSD(
  data: ArrayBuffer | File
): Promise<ArrayBuffer> {
  if (data instanceof File) return data.arrayBuffer()
  return data
}
