import { create } from "zustand";

interface AppState {
  isSidebarOpen: boolean;
}

interface AppActions {
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));
