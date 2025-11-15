import type { ChatFile } from "@/src/types/chat";
import type { ChatStoreActions, ChatStoreState } from "@/src/types/store";
import { create } from "zustand";

/**
 * Chat 状态Store：
 * 统一管理聊天流程标志位与文件队列
 */
export const useChatStore = create<ChatStoreState & ChatStoreActions>(
  (set, _get) => ({
    files: [],
    isFirst: false,
    isChatCompleted: true,
    isLoadingMessages: false,
    currentChatId: null,
    cancelStreamRef: null,

    setFiles: (files: ChatFile[]) => set({ files }),
    addFiles: (files: ChatFile[]) =>
      set((state) => ({ files: state.files.concat(files || []) })),
    updateFile: (id: string, partial: Partial<ChatFile>) =>
      set((state) => {
        const idx = state.files.findIndex((f) => f.id === id);
        if (idx === -1) return state;
        const next = state.files.slice();
        next[idx] = { ...next[idx], ...partial };
        return { files: next };
      }),
    removeFile: (id: string) =>
      set((state) => ({ files: state.files.filter((f) => f.id !== id) })),

    setIsFirst: (v: boolean) => set({ isFirst: !!v }),
    setIsChatCompleted: (v: boolean) => set({ isChatCompleted: !!v }),
    setIsLoadingMessages: (v: boolean) => set({ isLoadingMessages: !!v }),
    setCurrentChatId: (id: string | null) => set({ currentChatId: id || null }),

    setCancelStreamRef: (fn: (() => void) | null) =>
      set({ cancelStreamRef: fn || null }),
    clearCancelStreamRef: () => set({ cancelStreamRef: null }),

    // 重置流程（不清除文件队列）
    resetFlowFlags: () =>
      set({
        isChatCompleted: true,
        isLoadingMessages: false,
        currentChatId: null,
        cancelStreamRef: null,
      }),
  })
);
