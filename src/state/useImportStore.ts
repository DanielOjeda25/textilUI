import { create } from 'zustand'

interface ImportState {
  isOpen: boolean
  loading: boolean
  open: () => void
  close: () => void
  setLoading: (v: boolean) => void
}

export const useImportStore = create<ImportState>((set) => ({
  isOpen: false,
  loading: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, loading: false }),
  setLoading: (v: boolean) => set({ loading: v }),
}))

