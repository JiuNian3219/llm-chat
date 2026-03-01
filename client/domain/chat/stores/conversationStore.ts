import server from "@/domain/chat/services";
import type { ConversationActions, ConversationState } from "@/src/types/store";
import { create } from "zustand";

/**
 * 会话 Store：
 * 负责管理会话列表、当前会话ID与标题、加载态等
 */
export const useConversation = create<ConversationState & ConversationActions>(
  (set, get) => ({
    /** 会话列表 */
    conversations: [],
    /** 当前选中会话 ID */
    currentConversationId: null,
    /** 当前会话标题 */
    currentTitle: "新对话",
    /** 是否正在加载会话列表 */
    isLoadingList: false,
    /** 是否正在加载会话标题 */
    isLoadingTitle: false,
    /** 设置当前选中会话 ID */
    setCurrentConversationId: (id) => set({ currentConversationId: id }),
    /** 设置当前会话标题 */
    setCurrentTitle: (title) => set({ currentTitle: title ?? "新对话" }),
    /** 从服务器获取会话列表 */
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
    /** 刷新会话列表（不清除当前选中） */
    refreshConversations: () => get().fetchConversations(),
    /** 从服务器获取当前会话标题 */
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
    /** 添加新会话到列表 */
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
    /** 更新会话标题 */
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
    /** 重命名会话 */
    renameConversation: async (conversationId, newTitle) => {
      const title = (newTitle || "").trim().slice(0, 30) || "新对话";
      await server.updateConversationTitle(conversationId, title);
      get().updateConversationTitle(conversationId, title);
    },
    /** 异步删除会话 */
    deleteConversationAsync: async (conversationId) => {
      await server.deleteConversation(conversationId);
      get().removeConversation(conversationId);
    },
    /** 从列表移除会话 */
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
