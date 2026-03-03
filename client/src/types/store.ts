import type { ChatMessage, MessageStatus } from "./message";

export const ChatStatus = {
  Idle: "idle",
  Generating: "generating",
  Error: "error",
} as const;

export type ChatStatus = (typeof ChatStatus)[keyof typeof ChatStatus];

/**
 * 聊天 Store 状态
 */
export interface ChatStoreState {
  /** 消息 ID 有序列表 */
  messageIds: string[];
  /** 消息 ID → 消息对象映射 */
  messagesById: Record<string, ChatMessage>;
  /** 会话级流程状态机 */
  status: ChatStatus;
  /** 当前流式聊天 ID（用于取消） */
  currentChatId: string | null;
  /** 当前活跃 SSE 连接的取消函数（非序列化状态，仅运行时使用） */
  cancelSSE: (() => void) | null;
  /** SSE 当前正在为哪个会话生成内容；用于 loadConversationMessages 判断是否跳过重置 */
  sseConversationId: string | null;
  /** 是否正在加载历史消息 */
  isLoadingMessages: boolean;
  /** 是否还有更多历史消息可加载 */
  hasMoreMessages: boolean;
  /** 是否正在加载更多消息 */
  isLoadingMoreMessages: boolean;
  /** 游标：当前已加载消息中最旧的消息 ID（用于向上翻页） */
  oldestMessageId: string | null;
}

export interface ChatStoreActions {
  /** 从服务器获取消息 */
  setFromServer: (_messages: ChatMessage[]) => void;
  /** 追加消息 */
  appendMessage: (_message: ChatMessage) => void;
  /** 追加内容 */
  appendContent: (_id: string, _delta: string) => void;
  /** 追加思考链增量 */
  appendReasoning: (_id: string, _delta: string) => void;
  /** 设置消息状态 */
  setMessageStatus: (_id: string, _status: MessageStatus) => void;
  /** 设置消息关联的 chatId */
  setChatId: (_id: string, _chatId: string) => void;
  /** 设置消息内容 */
  setContent: (_id: string, _content: string) => void;
  /** 设置思考链内容（断线重连 snapshot 恢复用） */
  setReasoning: (_id: string, _reasoning: string) => void;
  /** 添加跟进建议 */
  addFollowUp: (_id: string, _item: string) => void;
  /** 重置消息 */
  resetMessages: () => void;
  /** 设置会话状态 */
  setStatus: (_status: ChatStatus) => void;
  /** 设置当前流式聊天 ID */
  setCurrentChatId: (_id: string | null) => void;
  /** 设置当前活跃 SSE 连接的取消函数 */
  setCancelSSE: (_fn: (() => void) | null) => void;
  /** 设置 SSE 当前正在服务的会话 ID */
  setSSEConversationId: (_id: string | null) => void;
  /** 设置是否正在加载历史消息 */
  setIsLoadingMessages: (_v: boolean) => void;
  /** 前置插入一批旧消息，并更新分页游标与 hasMore 标志 */
  prependMessages: (_messages: ChatMessage[], _hasMore: boolean) => void;
  /** 初始化消息分页元数据（首次加载后调用） */
  setMessagePagination: (_hasMore: boolean, _oldestMessageId: string | null) => void;
  /** 设置是否正在加载更多消息 */
  setIsLoadingMoreMessages: (_v: boolean) => void;
}

/**
 * 会话 Store 状态
 */
export interface ConversationState {
  /** 会话列表（包含 ID、标题和更新时间，以及是否正在生成） */
  conversations: Array<{
    conversationId: string;
    title: string;
    updatedAt: Date | string;
    inProgress?: boolean;
    /** 标题是否已由 AI 生成就绪；false 表示仍在生成中，侧边栏应显示骨架屏 */
    titleReady?: boolean;
  }>;
  /** 当前选中会话 ID */
  currentConversationId: string | null;
  /** 当前会话标题 */
  currentTitle: string;
  /** 是否正在加载会话列表 */
  isLoadingList: boolean;
  /** 是否正在加载会话标题 */
  isLoadingTitle: boolean;
}

/**
 * 会话 Store 操作
 */
export interface ConversationActions {
  /** 设置当前选中会话 ID */
  setCurrentConversationId: (_id: string | null) => void;
  /** 设置当前会话标题 */
  setCurrentTitle: (_title: string) => void;
  /** 从服务器获取会话列表 */
  fetchConversations: () => Promise<void>;
  /** 刷新会话列表（不清除当前选中） */
  refreshConversations: () => Promise<void>;
  /** 从服务器获取当前会话标题 */
  fetchCurrentTitle: (_conversationId: string) => Promise<void>;
  /** 添加新会话到列表 */
  addNewConversation: (_conversationId: string, _title?: string) => void;
  /** 更新会话标题 */
  updateConversationTitle: (_conversationId: string, _newTitle: string) => void;
  /** 从列表移除会话 */
  removeConversation: (_conversationId: string) => void;
  /** 重命名会话 */
  renameConversation: (
    _conversationId: string,
    _newTitle: string,
  ) => Promise<void>;
  /** 异步删除会话 */
  deleteConversationAsync: (_conversationId: string) => Promise<void>;
}
