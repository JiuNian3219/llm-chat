import { create } from "zustand";

/**
 * 消息 Store：
 * 负责管理单一消息状态
 */

/**
 * @typedef {Object} ChatMessage 消息
 * @property {string} id 消息ID
 * @property {string} role 消息角色 'user' | 'assistant'
 * @property {string} content 消息内容
 * @property {string|null} chatId 所属会话ID
 * @property {boolean} [isLoading] 是否加载中
 * @property {boolean} [isCancel] 是否取消
 * @property {boolean} [isError] 是否错误
 * @property {Array<string>} [followUps] 后续操作
 * @property {Array<object>} [files] 文件列表
 */

/**
 * @typedef {Object} MessagesState 消息状态
 * @property {string[]} messageIds 消息ID列表
 * @property {Record<string, ChatMessage>} messagesById 消息ID到消息的映射
 */

/**
 * @typedef {Object} MessagesActions 消息操作
 * @property {(messages: ChatMessage[]) => void} setFromServer 设置消息（来自服务器列表）
 * @property {(message: ChatMessage) => void} append 追加一条消息到末尾
 * @property {(id: string, delta: string) => void} appendContent 为指定消息追加内容
 * @property {(id: string, loading: boolean) => void} setLoading 设置加载态
 * @property {(id: string, chatId: string) => void} setChatId 设置所属会话ID
 * @property {(id: string, partial: Partial<ChatMessage>) => void} patch 部分更新指定消息
 * @property {(id: string, content: string) => void} setContent 设置指定消息内容
 * @property {(id: string, item: string) => void} addFollowUp 添加后续操作
 * @property {(id: string) => void} markCancel 标记为取消
 * @property {(id: string, errorText: string) => void} markError 标记为错误
 * @property {() => void} reset 重置状态
 */

export const useMessages =
  (create((set, get) => ({
    messageIds: [],
    messagesById: {},

    /** 设置消息（来自服务器列表） */
    /** @param {ChatMessage[]} messages */
    setFromServer: (messages) => {
      const ids = [];
      const byId = {};
      for (const m of messages || []) {
        ids.push(m.id);
        byId[m.id] = m;
      }
      set({ messageIds: ids, messagesById: byId });
    },

    /** 追加一条消息到末尾 */
    /** @param {ChatMessage} message */
    append: (message) => {
      const id = message.id;
      set((state) => ({
        messageIds: state.messageIds.concat(id),
        messagesById: { ...state.messagesById, [id]: message },
      }));
    },

    /** 为指定消息追加内容 */
    /** @param {string} id @param {string} delta */
    appendContent: (id, delta) => {
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

    /** 设置加载态 */
    /** @param {string} id @param {boolean} loading */
    setLoading: (id, loading) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, isLoading: loading } },
        };
      });
    },

    /** 设置 chatId */
    /** @param {string} id @param {string} chatId */
    setChatId: (id, chatId) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, chatId } },
        };
      });
    },

    /** 局部更新字段 */
    /** @param {string} id @param {Partial<ChatMessage>} partial */
    patch: (id, partial) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, ...partial } },
        };
      });
    },

    /** 直接设置内容 */
    /** @param {string} id @param {string} content */
    setContent: (id, content) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, content } },
        };
      });
    },

    /** 添加后续建议 */
    /** @param {string} id @param {string} item */
    addFollowUp: (id, item) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        const followUps = Array.isArray(prev.followUps) ? prev.followUps.concat(item) : [item];
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, followUps } },
        };
      });
    },

    /** 标记取消 */
    /** @param {string} id */
    markCancel: (id) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: { ...state.messagesById, [id]: { ...prev, isCancel: true } },
        };
      });
    },

    /** 标记错误 */
    /** @param {string} id @param {string} errorText */
    markError: (id, errorText) => {
      set((state) => {
        const prev = state.messagesById[id];
        if (!prev) return state;
        return {
          messagesById: {
            ...state.messagesById,
            [id]: { ...prev, isError: true, isLoading: false, isCancel: false, content: errorText },
          },
        };
      });
    },

    /** 重置消息列表 */
    reset: () => set({ messageIds: [], messagesById: {} }),
  })));