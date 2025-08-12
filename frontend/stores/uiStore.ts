import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type UiState = {
  loadingGlobal: boolean;
  setLoadingGlobal: (v: boolean) => void;
};

export const useUiStore = create<UiState>()(
  immer((set) => ({
    loadingGlobal: false,
    setLoadingGlobal: (v) => set((s) => void (s.loadingGlobal = v)),
  }))
);


