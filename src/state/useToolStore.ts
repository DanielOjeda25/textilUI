import { create } from 'zustand'
import type { ToolType } from '../canvas/tools/tool.types'

interface ToolState {
  activeTool: ToolType
  setActiveTool: (tool: ToolType) => void
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  setActiveTool: (tool: ToolType) => set({ activeTool: tool }),
}))

