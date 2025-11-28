import { useCanvasStore } from '../src/state/useCanvasStore'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

type DiffEntry = { id: string; ok: boolean; differences?: string[] }

function computeDiffs(): DiffEntry[] {
  const s = useCanvasStore.getState()
  const ids = s.selectedLayerIds.length ? s.selectedLayerIds : s.layers.filter((l) => l.visible && !l.locked).map((l) => l.id)
  s.setSelection(ids)
  const res = s.validateResetSelection()
  const diffs: DiffEntry[] = []
  for (const { id, ok } of res) {
    if (ok) { diffs.push({ id, ok }); continue }
    const l = useCanvasStore.getState().layers.find((x) => x.id === id)
    if (!l) { diffs.push({ id, ok, differences: ['missing-layer'] }); continue }
    const out: string[] = []
    const baseX = l.originalX ?? 0
    const baseY = l.originalY ?? 0
    const baseRot = l.originalRotation ?? 0
    if (l.x !== baseX) out.push('x')
    if (l.y !== baseY) out.push('y')
    if (l.rotation !== baseRot) out.push('rotation')
    if (l.type === 'raster') {
      const rw = (l as any).originalWidth ?? (l as any).width
      const rh = (l as any).originalHeight ?? (l as any).height
      if ((l as any).width !== rw) out.push('width')
      if ((l as any).height !== rh) out.push('height')
      if (l.scale !== 1) out.push('scale')
    } else {
      const os = l.originalScale ?? 1
      if (l.scale !== os) out.push('scale')
    }
    diffs.push({ id, ok, differences: out })
  }
  return diffs
}

function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportDir = join(process.cwd(), 'reports')
  try { mkdirSync(reportDir, { recursive: true }) } catch { /* ignore */ }
  const entries = computeDiffs()
  const path = join(reportDir, `validateResetSelection-${timestamp}.json`)
  writeFileSync(path, JSON.stringify({ timestamp, entries }, null, 2))
  // eslint-disable-next-line no-console
  console.log(`written: ${path}`)
}

main()
