import type { ChatFile } from "./chat";
import type { ChatMessage } from "./message";

/**
 * 聊天 Store 状态
 * - files: 当前会话待发送/已上传文件列表
 * - isFirst: 是否首次发送（用于新建会话逻辑）
 * - isChatCompleted: 当前是否处于可发送状态（流式完成）
 * - isLoadingMessages: 是否正在加载历史消息
 * - currentChatId: 当前流式聊天 ID（用于取消）
 * - cancelStreamRef: 取消函数引用（按钮触发）
 */
export interface ChatStoreState {
  files: ChatFile[];
  isFirst: boolean;
  isChatCompleted: boolean;
  isLoadingMessages: boolean;
  currentChatId: string | null;
  cancelStreamRef: (() => void) | null;
}

/**
 * 聊天 Store 操作
 * - setFiles: 设置文件列表
 * - addFiles: 添加文件到列表
 * - updateFile: 更新文件信息
 * - removeFile: 从列表移除文件
 * - setIsFirst: 设置是否首次发送
 * - setIsChatCompleted: 设置是否可发送状态
 * - setIsLoadingMessages: 设置是否加载历史消息
 * - setCurrentChatId: 设置当前流式聊天 ID
 * - setCancelStreamRef: 设置取消函数引用
 * - clearCancelStreamRef: 清除取消函数引用
 * - resetFlowFlags: 重置流式相关标志
 */
export interface ChatStoreActions {
  setFiles: (_files: ChatFile[]) => void;
  addFiles: (_files: ChatFile[]) => void;
  updateFile: (_id: string, _partial: Partial<ChatFile>) => void;
  removeFile: (_id: string) => void;
  setIsFirst: (_v: boolean) => void;
  setIsChatCompleted: (_v: boolean) => void;
  setIsLoadingMessages: (_v: boolean) => void;
  setCurrentChatId: (_id: string | null) => void;
  setCancelStreamRef: (_fn: (() => void) | null) => void;
  clearCancelStreamRef: () => void;
  resetFlowFlags: () => void;
}

/**
 * 消息 Store 状态
 * - messageIds: 消息 ID 列表（按发送顺序）
 * - messagesById: 消息 ID 到消息对象的映射
 */
export interface MessagesState {
  messageIds: string[];
  messagesById: Record<string, ChatMessage>;
}

/**
 * 消息 Store 操作
 * - setFromServer: 从服务器设置消息列表
 * - append: 添加消息到列表
 * - appendContent: 追加消息内容
 * - setLoading: 设置消息加载状态
 * - setChatId: 设置消息所属聊天 ID
 * - patch: 部分更新消息
 * - setContent: 设置消息内容
 * - addFollowUp: 添加跟进项
 * - markCancel: 标记取消
 * - markError: 标记错误
 * - reset: 重置状态
 */
export interface MessagesActions {
  setFromServer: (_messages: ChatMessage[]) => void;
  append: (_message: ChatMessage) => void;
  appendContent: (_id: string, _delta: string) => void;
  setLoading: (_id: string, _loading: boolean) => void;
  setChatId: (_id: string, _chatId: string) => void;
  patch: (_id: string, _partial: Partial<ChatMessage>) => void;
  setContent: (_id: string, _content: string) => void;
  addFollowUp: (_id: string, _item: string) => void;
  markCancel: (_id: string) => void;
  markError: (_id: string, _errorText: string) => void;
  reset: () => void;
}

/**
 * 会话 Store 状态
 * - conversations: 会话列表（包含 ID、标题和更新时间）
 * - currentConversationId: 当前选中会话 ID
 * - currentTitle: 当前会话标题
 * - isLoadingList: 是否正在加载会话列表
 * - isLoadingTitle: 是否正在加载会话标题
 */
export interface ConversationState {
  conversations: Array<{
    conversationId: string;
    title: string;
    updatedAt: Date | string;
  }>;
  currentConversationId: string | null;
  currentTitle: string;
  isLoadingList: boolean;
  isLoadingTitle: boolean;
}

/**
 * 会话 Store 操作
 * - setCurrentConversationId: 设置当前选中会话 ID
 * - setCurrentTitle: 设置当前会话标题
 * - fetchConversations: 从服务器获取会话列表
 * - refreshConversations: 刷新会话列表（不清除当前选中）
 * - fetchCurrentTitle: 从服务器获取当前会话标题
 * - addNewConversation: 添加新会话到列表
 * - updateConversationTitle: 更新会话标题
 */
export interface ConversationActions {
  setCurrentConversationId: (_id: string | null) => void;
  setCurrentTitle: (_title: string) => void;
  fetchConversations: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  fetchCurrentTitle: (_conversationId: string) => Promise<void>;
  addNewConversation: (_conversationId: string, _title?: string) => void;
  updateConversationTitle: (_conversationId: string, _newTitle: string) => void;
  removeConversation: (_conversationId: string) => void;
  renameConversation: (_conversationId: string, _newTitle: string) => Promise<void>;
  deleteConversationAsync: (_conversationId: string) => Promise<void>;
}
