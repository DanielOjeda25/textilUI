declare module 'psd.js' {
  export function fromArrayBuffer(buffer: ArrayBuffer): {
    parse(): void
    image: { toCanvas(): HTMLCanvasElement }
  }
}

