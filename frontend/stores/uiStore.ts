import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type UiState = {
  loadingGlobal: boolean;
  setLoadingGlobal: (v: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>()(
  immer((set) => ({
    loadingGlobal: false,
    setLoadingGlobal: (v) => set((s) => void (s.loadingGlobal = v)),
    sidebarCollapsed: false,
    setSidebarCollapsed: (v) => set((s) => void (s.sidebarCollapsed = v)),
    toggleSidebar: () => set((s) => void (s.sidebarCollapsed = !s.sidebarCollapsed)),
  }))
);


