import { create } from 'zustand'
import type { Command } from '../history/commands'

interface HistoryState {
  undoStack: Command[]
  redoStack: Command[]
  execute: (cmd: Command) => void
  undo: () => void
  redo: () => void
  preview: (cmd: Command) => void
  clear: () => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  execute: (cmd: Command) => {
    cmd.do()
    set({ undoStack: [...get().undoStack, cmd], redoStack: [] })
  },
  undo: () => {
    const stack = get().undoStack.slice()
    const cmd = stack.pop()
    if (!cmd) return
    cmd.undo()
    set({ undoStack: stack, redoStack: [...get().redoStack, cmd] })
  },
  redo: () => {
    const stack = get().redoStack.slice()
    const cmd = stack.pop()
    if (!cmd) return
    cmd.do()
    set({ redoStack: stack, undoStack: [...get().undoStack, cmd] })
  },
  preview: (cmd: Command) => {
    cmd.do()
  },
  clear: () => set({ undoStack: [], redoStack: [] }),
}))

