import server from "@/domain/chat/services";
import type { ConversationActions, ConversationState } from "@/src/types/store";
import { create } from "zustand";

/**
 * 会话 Store：
 * 负责管理会话列表、当前会话ID与标题、加载态等
 */
export const useConversation = create<ConversationState & ConversationActions>(
  (set, get) => ({
    conversations: [],
    currentConversationId: null,
    currentTitle: "新对话",
    isLoadingList: false,
    isLoadingTitle: false,
    setCurrentConversationId: (id) => set({ currentConversationId: id }),
    setCurrentTitle: (title) => set({ currentTitle: title ?? "新对话" }),
    fetchConversations: async () => {
      try {
        set({ isLoadingList: true });
        const { data } = await server.getAllConversationList();
        set({ conversations: data.conversations || [] });
      } catch (error) {
        console.error("获取会话列表失败:", error);
        // 交由外层调用展示错误信息
        throw error;
      } finally {
        set({ isLoadingList: false });
      }
    },
    refreshConversations: async () => get().fetchConversations(),
    fetchCurrentTitle: async (conversationId) => {
      if (!conversationId) {
        set({ currentTitle: "" });
        return;
      }
      try {
        set({ isLoadingTitle: true });
        const { data } = await server.getConversationTitle(conversationId);
        set({ currentTitle: data.title || "新对话" });
      } catch (error) {
        console.error("获取会话标题失败:", error);
        set({ currentTitle: "新对话" });
      } finally {
        set({ isLoadingTitle: false });
      }
    },
    addNewConversation: (conversationId, title = "新对话") => {
      set((state) => {
        const exists = state.conversations.some(
          (conv) => conv.conversationId === conversationId
        );
        if (exists) return state;
        return {
          conversations: [
            { conversationId, title, updatedAt: new Date() },
            ...state.conversations,
          ],
        };
      });
    },
    updateConversationTitle: (conversationId, newTitle) => {
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.conversationId === conversationId
            ? { ...conv, title: newTitle }
            : conv
        ),
        currentTitle:
          conversationId === state.currentConversationId
            ? newTitle
            : state.currentTitle,
      }));
    },
    renameConversation: async (conversationId, newTitle) => {
      const title = (newTitle || "").trim().slice(0, 30) || "新对话";
      await server.updateConversationTitle(conversationId, title);
      get().updateConversationTitle(conversationId, title);
    },
    deleteConversationAsync: async (conversationId) => {
      await server.deleteConversation(conversationId);
      const isCurrent = get().currentConversationId === conversationId;
      set((state) => ({
        conversations: state.conversations.filter(
          (conv) => conv.conversationId !== conversationId
        ),
        currentConversationId: isCurrent ? null : state.currentConversationId,
        currentTitle: isCurrent ? "" : state.currentTitle,
      }));
    },
    removeConversation: (conversationId) => {
      set((state) => {
        const isCurrent = state.currentConversationId === conversationId;
        return {
          conversations: state.conversations.filter(
            (conv) => conv.conversationId !== conversationId
          ),
          currentConversationId: isCurrent ? null : state.currentConversationId,
          currentTitle: isCurrent ? "" : state.currentTitle,
        };
      });
    },
  })
);
