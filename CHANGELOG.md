## 2025-11-28

- src/state/useCanvasStore.ts:108–120 — eliminar `any` en `updateLayer` y tipado seguro para filtrar `original*`; razón: cumplir reglas TypeScript y proteger estado original.
- src/canvas/geometry/obb.ts — nuevo módulo con `worldCorners`, `layerCenterWorld`, `computeOBB`, `selectionOBB`, `topLeftFromCenter`; razón: separar geometría pura y garantizar OBB estable.
- src/canvas/geometry/sat.ts — nuevo módulo con `polygonAABBIntersect` y `polygonAABBContained`; razón: intersección/contención exactas vía SAT.
- src/canvas/selection/selectionUtils.ts — nuevo módulo con `selectByRect`, `pickTopAtPoint`, `selectionCenterOBB`, `applyGroupTransform`; razón: centralizar utilidades de selección y transformaciones grupales.
- src/canvas/KonvaCanvas.tsx — usar utilidades de selección y aplicar rotación/escala grupal relativa al OBB global en `onTransformEnd`; razón: evitar drift y commits precisos.
- tests/geometry/obb.spec.ts — añadido; cubre `worldCorners`, `layerCenterWorld`, `computeOBB` en rotaciones 0/45/90 y escalas.
- tests/geometry/sat.spec.ts — añadido; cubre intersecciones y contenciones con OBBs rotados.
- tests/selection/groupTransform.spec.ts — añadido; simula 3 capas, rotación grupal y validación por capa.
- package.json — scripts `test`/`validate` y dev deps `vitest`, `vite-node`; razón: ejecutar tests y validación.
- scripts/run-validate-reset.ts — script para `validateResetSelection()` con reporte JSON.

### Salida de tests (vitest)
- Todos los tests pasaron bajo `--environment=jsdom`. Ver salida incluida en el PR.

