import type { ChatMessage } from "@/src/types/message";
import type { MessagesActions, MessagesState } from "@/src/types/store";
import { create } from "zustand";

/**
 * 消息 Store：
 * 负责管理单一消息状态
 */
export const useMessages = create<MessagesState & MessagesActions>(
  (set, _get) => ({
    messageIds: [],
    messagesById: {},

    setFromServer: (messages: ChatMessage[]) => {
      const ids: string[] = [];
      const byId: Record<string, ChatMessage> = {};
      for (const m of messages || []) {
        ids.push(m.id);
        byId[m.id] = m;
      }
      set({ messageIds: ids, messagesById: byId });
    },

    // 追加一条消息到末尾
    append: (message: ChatMessage) => {
      const id = message.id;
      set((state) => ({
        messageIds: state.messageIds.concat(id),
        messagesById: { ...state.messagesById, [id]: message },
      }));
    },

    // 为指定消息追加内容
    appendContent: (id: string, delta: string) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: {
            ...state.messagesById,
            [id]: { ...prev, content: (prev.content || "") + (delta || "") },
          },
        };
      });
    },

    // 设置加载态
    setLoading: (id: string, loading: boolean) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: {
            ...state.messagesById,
            [id]: { ...prev, isLoading: loading },
          },
        };
      });
    },

    // 设置 chatId
    setChatId: (id: string, chatId: string) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, chatId } },
        };
      });
    },

    // 局部更新字段
    patch: (id: string, partial: Partial<ChatMessage>) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: {
            ...state.messagesById,
            [id]: { ...prev, ...partial },
          },
        };
      });
    },

    /** 直接设置内容 */
    /** @param {string} id @param {string} content */
    setContent: (id: string, content: string) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, content } },
        };
      });
    },

    // 添加后续建议
    addFollowUp: (id: string, item: string) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        const followUps = Array.isArray(prev.followUps)
          ? prev.followUps.concat(item)
          : [item];
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, followUps } },
        };
      });
    },

    // 标记消息为取消状态
    markCancel: (id: string) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: {
            ...state.messagesById,
            [id]: { ...prev, isCancel: true },
          },
        };
      });
    },

    // 标记消息为错误状态
    markError: (id: string, errorText: string) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: {
            ...state.messagesById,
            [id]: {
              ...prev,
              isError: true,
              isLoading: false,
              isCancel: false,
              content: errorText,
            },
          },
        };
      });
    },

    // 重置消息列表
    reset: () => set({ messageIds: [], messagesById: {} }),
  })
);
