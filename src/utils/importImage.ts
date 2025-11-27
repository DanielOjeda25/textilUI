import { LayerFactory } from '../canvas/layers/LayerFactory'

export async function importImage(file: File) {
  const buffer = await file.arrayBuffer()
  const url = URL.createObjectURL(file)
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image load error'))
    image.src = url
  })
  const layer = LayerFactory.createRaster(img, { fileBuffer: buffer })
  URL.revokeObjectURL(url)
  return layer
}

