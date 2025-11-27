import type { AnyLayer, RasterLayer, VectorLayer, TextLayer } from '../../canvas/layers/layer.types'
import { LayerFactory } from '../../canvas/layers/LayerFactory'
import { loadImage } from '../../canvas/utils/loadImage'

function extOf(file: File): string {
    const n = file.name.toLowerCase()
    const i = n.lastIndexOf('.')
    return i >= 0 ? n.slice(i + 1) : ''
}

async function importRasterFromFile(file: File): Promise<RasterLayer> {
  const img = await loadImage(file)
  const buf = await file.arrayBuffer()
  return LayerFactory.createRaster(img, { fileBuffer: buf })
}

async function importVectorFromFile(file: File): Promise<VectorLayer> {
    const text = await file.text()
    return LayerFactory.createVector(text)
}

async function importTextFromFile(file: File): Promise<TextLayer> {
    const text = await file.text()
    return LayerFactory.createText(text)
}

export async function importFile(file: File): Promise<AnyLayer[]> {
    const e = extOf(file)
    if (e === 'png' || e === 'jpg' || e === 'jpeg') {
        return [await importRasterFromFile(file)]
    }
    if (e === 'svg') {
        return [await importVectorFromFile(file)]
    }
    if (e === 'txt') {
        return [await importTextFromFile(file)]
    }
    if (e === 'pdf') {
        const mod = await import('pdfjs-dist')
        const data = new Uint8Array(await file.arrayBuffer())
        try {
            const gw = (mod as unknown as { GlobalWorkerOptions?: { workerSrc?: string | undefined } }).GlobalWorkerOptions
            if (gw) gw.workerSrc = undefined
        } catch { void 0 }
        type PDFViewport = { width: number; height: number }
        type PDFPageProxy = { getViewport: (opts: { scale: number }) => PDFViewport; render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }) => { promise: Promise<void> } }
        type PDFDocumentProxy = { getPage: (num: number) => Promise<PDFPageProxy> }
        type PDFLoadingTask = { promise: Promise<PDFDocumentProxy> }
        const getDocument = (mod as unknown as { getDocument: (params: { data: Uint8Array }) => PDFLoadingTask }).getDocument
        const doc = await getDocument({ data }).promise
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: ctx, viewport }).promise
        const img = new Image()
        img.src = canvas.toDataURL('image/png')
        await new Promise<void>((res) => { img.onload = () => res() })
        return [LayerFactory.createRaster(img)]
    }
    if (e === 'psd') {
        try {
            const PSDMod = await import('psd.js')
            const buf = await file.arrayBuffer()
            const psd = (PSDMod as unknown as { default?: unknown; fromArrayBuffer: (b: ArrayBuffer) => { parse: () => void; image: { toCanvas: () => HTMLCanvasElement } } }).fromArrayBuffer(buf)
            psd.parse()
            const canvas = psd.image.toCanvas()
            const img = new Image()
            img.src = canvas.toDataURL('image/png')
            await new Promise<void>((res) => { img.onload = () => res() })
            return [LayerFactory.createRaster(img)]
        } catch {
            const fallback = LayerFactory.createText('PSD no soportado en este entorno')
            return [fallback]
        }
    }
    const fallback = LayerFactory.createText(`Tipo no soportado: ${e}`)
    return [fallback]
}

