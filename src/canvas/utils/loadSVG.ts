export function loadSVG(svg: string): Document {
  const parser = new DOMParser()
  return parser.parseFromString(svg, 'image/svg+xml')
}
