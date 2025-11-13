import server from "@/domain/chat/services";
import { create } from "zustand";

/**
 * 会话 Store：
 * 负责管理会话列表、当前会话ID与标题、加载态等
 */

/**
 * @typedef {Object} ConversationListItem
 * @property {string} conversationId - 会话ID
 * @property {string} title - 会话标题
 * @property {Date|string} updatedAt - 最近更新时间
 */

/**
 * @typedef {Object} ConversationState
 * @property {ConversationListItem[]} conversations - 会话列表
 * @property {string|null} currentConversationId - 当前会话ID
 * @property {string} currentTitle - 当前会话标题
 * @property {boolean} isLoadingList - 会话列表加载中
 * @property {boolean} isLoadingTitle - 标题加载中
 */

/**
 * @typedef {Object} ConversationActions
 * @property {(id: string|null) => void} setCurrentConversationId - 设置当前会话ID
 * @property {(title: string) => void} setCurrentTitle - 设置当前会话标题
 * @property {() => Promise<void>} fetchConversations - 拉取会话列表
 * @property {() => Promise<void>} refreshConversations - 刷新会话列表
 * @property {(conversationId: string) => Promise<void>} fetchCurrentTitle - 拉取当前会话标题
 * @property {(conversationId: string, title?: string) => void} addNewConversation - 在列表顶部添加新会话
 * @property {(conversationId: string, newTitle: string) => void} updateConversationTitle - 更新列表中的会话标题
 */
export const useConversation =
  (create((set, get) => ({
    conversations: [],
    currentConversationId: null,
    currentTitle: "新对话",
    isLoadingList: false,
    isLoadingTitle: false,
    /** 设置当前会话ID */
    /** @param {string|null} id */
    setCurrentConversationId: (id) => set({ currentConversationId: id }),
    /** 设置当前会话标题 */
    /** @param {string} title */
    setCurrentTitle: (title) => set({ currentTitle: title ?? "新对话" }),
    /** 拉取会话列表 */
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
    /** 刷新会话列表 */
    refreshConversations: async () => {
      return get().fetchConversations();
    },
    /** 拉取当前会话标题 */
    /** @param {string} conversationId */
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

    /** 在列表顶部添加新会话 */
    /** @param {string} conversationId @param {string} [title="新对话"] */
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

    /** 更新列表中的会话标题，并在当前会话时同步 currentTitle */
    /** @param {string} conversationId @param {string} newTitle */
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
  })));
