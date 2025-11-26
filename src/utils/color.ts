export type RGB = { r: number; g: number; b: number }

export function hexToRgb(hex: string): RGB {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const h = ((r & 255) << 16) | ((g & 255) << 8) | (b & 255)
  return '#' + h.toString(16).padStart(6, '0')
}
