import type { ChatMessage, MessageStatus } from "@/src/types/message";
import { ChatStatus, type ChatStoreActions, type ChatStoreState } from "@/src/types/store";
import { create } from "zustand";

/** 对 messagesById 中单条消息做字段 patch，找不到消息时返回原 state */
function patchMessage(
  state: ChatStoreState & ChatStoreActions,
  id: string,
  patch: Partial<ChatMessage>
) {
  const prev = state.messagesById[id];
  if (!prev) return state;
  return {
    messagesById: { ...state.messagesById, [id]: { ...prev, ...patch } },
  };
}

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set) => ({
  /** 消息 ID 有序列表 */
  messageIds: [],
  /** 消息 ID → 消息对象映射 */
  messagesById: {},
  /** 会话级流程状态机 */
  status: ChatStatus.Idle,
  /** 当前流式聊天 ID（用于取消） */
  currentChatId: null,
  /** 当前活跃 SSE 连接的取消函数（非序列化状态，仅运行时使用） */
  cancelSSE: null,
  /** 是否正在加载历史消息 */
  isLoadingMessages: false,

  /** 从服务器获取消息 */
  setFromServer: (messages: ChatMessage[]) => {
    const ids: string[] = [];
    const byId: Record<string, ChatMessage> = {};
    for (const m of messages || []) {
      ids.push(m.id);
      byId[m.id] = m;
    }
    set({ messageIds: ids, messagesById: byId });
  },

  /** 追加消息 */
  appendMessage: (message: ChatMessage) => {
    set((state) => ({
      messageIds: state.messageIds.concat(message.id),
      messagesById: { ...state.messagesById, [message.id]: message },
    }));
  },

  /** 追加内容 */
  appendContent: (id: string, delta: string) => {
    set((state) => {
      const prev = state.messagesById[id];
      if (!prev) return state;
      return patchMessage(state, id, { content: (prev.content || "") + (delta || "") });
    });
  },

  /** 设置消息状态 */
  setMessageStatus: (id: string, status: MessageStatus) => {
    set((state) => patchMessage(state, id, { status }));
  },

  /** 设置消息关联的 chatId */
  setChatId: (id: string, chatId: string) => {
    set((state) => patchMessage(state, id, { chatId }));
  },

  /** 设置消息内容 */
  setContent: (id: string, content: string) => {
    set((state) => patchMessage(state, id, { content }));
  },

  /** 添加跟进建议 */
  addFollowUp: (id: string, item: string) => {
    set((state) => {
      const prev = state.messagesById[id];
      if (!prev) return state;
      const followUps = Array.isArray(prev.followUps)
        ? prev.followUps.concat(item)
        : [item];
      return patchMessage(state, id, { followUps });
    });
  },

  /** 重置消息 */
  resetMessages: () => set({ messageIds: [], messagesById: {} }),

  /** 设置会话状态 */
  setStatus: (status: ChatStatus) => set({ status }),
  /** 设置当前流式聊天 ID */
  setCurrentChatId: (id: string | null) => set({ currentChatId: id }),
  /** 设置当前活跃 SSE 连接的取消函数 */
  setCancelSSE: (fn) => set({ cancelSSE: fn }),
  /** 设置是否正在加载历史消息 */
  setIsLoadingMessages: (v: boolean) => set({ isLoadingMessages: v }),
}));
