import type { ChatFile } from "@/src/types/chat";
import { create } from "zustand";

export interface FileStoreState {
  files: ChatFile[];
  /** 正在进行的上传请求的 AbortController 映射（file.id → controller） */
  abortControllers: Record<string, AbortController>;
}

export interface FileStoreActions {
  setFiles: (files: ChatFile[]) => void;
  addFiles: (files: ChatFile[]) => void;
  updateFile: (id: string, partial: Partial<ChatFile>) => void;
  removeFile: (id: string) => void;
  setAbortController: (id: string, controller: AbortController) => void;
  removeAbortController: (id: string) => void;
  clearAll: () => void;
}

export const useFileStore = create<FileStoreState & FileStoreActions>(
  (set) => ({
    files: [],
    abortControllers: {},

    setFiles: (files) => set({ files }),

    addFiles: (files) =>
      set((state) => ({ files: state.files.concat(files || []) })),

    updateFile: (id, partial) =>
      set((state) => {
        const idx = state.files.findIndex((f) => f.id === id);
        if (idx === -1) return state;
        const next = state.files.slice();
        next[idx] = { ...next[idx], ...partial };
        return { files: next };
      }),

    removeFile: (id) =>
      set((state) => ({
        files: state.files.filter((f) => f.id !== id),
      })),

    setAbortController: (id, controller) =>
      set((state) => ({
        abortControllers: { ...state.abortControllers, [id]: controller },
      })),

    removeAbortController: (id) =>
      set((state) => {
        const { [id]: _, ...rest } = state.abortControllers;
        return { abortControllers: rest };
      }),

    clearAll: () => set({ files: [], abortControllers: {} }),
  }),
);
