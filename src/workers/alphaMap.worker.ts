type AlphaReq = { layerId: string; imageArrayBuffer: ArrayBuffer; maxSize?: number }
type AlphaRes = { layerId: string; w: number; h: number; alphaBuffer: Uint8Array }

async function buildAlpha({ layerId, imageArrayBuffer, maxSize = 256 }: AlphaReq): Promise<AlphaRes> {
    const blob = new Blob([imageArrayBuffer])
    const bitmap = await createImageBitmap(blob)
    const aspect = bitmap.width / bitmap.height
    let w = maxSize
    let h = Math.round(maxSize / aspect)
    if (aspect < 1) { h = maxSize; w = Math.round(maxSize * aspect) }
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D
    ctx.drawImage(bitmap, 0, 0, w, h)
    const img = ctx.getImageData(0, 0, w, h)
    const out = new Uint8Array(w * h)
    for (let i = 0; i < w * h; i++) {
        out[i] = img.data[i * 4 + 3] > 0 ? 1 : 0
    }
    return { layerId, w, h, alphaBuffer: out }
}

self.onmessage = async (ev: MessageEvent<AlphaReq>) => {
    const res = await buildAlpha(ev.data)
    const transfer: Transferable[] = [res.alphaBuffer.buffer]
    // @ts-expect-error postMessage typing in workers
    self.postMessage(res, transfer)
}

