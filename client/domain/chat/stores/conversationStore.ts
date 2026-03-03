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
    currentTitle: "",
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
        set({ currentTitle: "", isLoadingTitle: false });
        return;
      }
      const { currentConversationId, currentTitle } = get();
      // 已有标题且为同一会话时不再开启骨架屏，避免流结束后的 fetch 造成闪烁
      const isRefresh = currentConversationId === conversationId && !!currentTitle;
      try {
        if (!isRefresh) set({ isLoadingTitle: true });
        const { data } = await server.getConversationTitle(conversationId);
        if (data?.titleReady) {
          set({ currentTitle: data.title || "新对话", isLoadingTitle: false });
        }
        // titleReady=false 时保持 isLoadingTitle=true，由 pollConversationTitle
        // 在标题就绪后调用 updateConversationTitle 统一关闭加载态
      } catch (error) {
        console.error("获取会话标题失败:", error);
        set({ currentTitle: "新对话", isLoadingTitle: false });
      }
    },
    /** 添加新会话到列表，并立即选中、开启标题加载态 */
    addNewConversation: (conversationId, title = "新对话") => {
      set((state) => {
        const exists = state.conversations.some(
          (conv) => conv.conversationId === conversationId
        );
        if (exists) return state;
        return {
          conversations: [
            { conversationId, title, updatedAt: new Date(), titleReady: false },
            ...state.conversations,
          ],
          // 立即选中，侧边栏高亮无需等待路由 useEffect
          currentConversationId: conversationId,
          // 清空标题并开启骨架屏，等待 pollConversationTitle 就绪后关闭
          currentTitle: "",
          isLoadingTitle: true,
        };
      });
    },
    /** 更新会话标题，并在更新当前会话时关闭标题加载态 */
    updateConversationTitle: (conversationId, newTitle) => {
      set((state) => {
        const isCurrent = conversationId === state.currentConversationId;
        return {
          conversations: state.conversations.map((conv) =>
            conv.conversationId === conversationId
              ? { ...conv, title: newTitle, titleReady: true }
              : conv
          ),
          currentTitle: isCurrent ? newTitle : state.currentTitle,
          // 标题就绪时关闭顶部骨架屏
          isLoadingTitle: isCurrent ? false : state.isLoadingTitle,
        };
      });
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
