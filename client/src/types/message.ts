import type { ChatFile } from "./chat";

/**
 * 消息角色
 * - user: 用户消息
 * - assistant: AI 助手消息
 */
export type Role = "user" | "assistant";

/**
 * 消息状态机
 */
export const MessageStatus = {
  /** 已创建，等待第一个 delta（显示加载动画） */
  Pending: "pending",
  /** 正在接收流式内容 */
  Streaming: "streaming",
  /** 内容已全部生成完毕 */
  Completed: "completed",
  /** 用户主动取消 */
  Canceled: "canceled",
  /** 生成出错 */
  Error: "error",
} as const;

export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

/**
 * 前端消息结构
 */
export interface ChatMessage {
  /** 前端消息唯一标识（与后端 `_id` 对应） */
  id: string;
  /** 消息角色 */
  role: Role;
  /** 文本内容（当为多模态时为解析后的纯文本） */
  content: string;
  /** 会话内单次聊天标识（用于取消流式） */
  chatId: string | null;
  /** 会话标识 */
  conversationId?: string;
  /** 消息当前所处状态（替代原来的 isLoading / isTextCompleted / isCancel / isError） */
  status: MessageStatus;
  /** AI 跟进建议 */
  followUps: string[];
  /** 上传的文件列表（上传完成后为后端返回的文件项） */
  files?: ChatFile[];
}

/**
 * 后端消息结构（原始）
 * - _id: 后端消息唯一标识
 * - chatId: 会话内单次聊天标识（用于取消流式）
 * - role: 消息角色
 * - content: 文本内容（当为多模态时为解析后的纯文本）
 * - contentType: 内容类型
 * - files: 上传的文件列表（上传完成后为后端返回的文件项）
 * - followUps: AI 跟进建议
 * - status: 消息状态
 */
export interface ServerMessage {
  /** 后端消息唯一标识 */
  _id: string;
  /** 会话内单次聊天标识（用于取消流式） */
  chatId: string | null;
  /** 消息角色 */
  role: Role;
  /** 文本内容（当为多模态时为解析后的纯文本） */
  content: string;
  /** 内容类型 */
  contentType: "text" | "object_string";
  /** 上传的文件列表（上传完成后为后端返回的文件项） */
  files: Array<{
    /** 文件 ID */
    fileId: string;
    /** 文件名 */
    originalname: string;
    /** 文件大小（字节） */
    size: number;
    /** 服务器可访问地址（上传完成后存在） */
    url: string;
    /** 文件类型（图片或普通文件） */
    isImage: boolean;
  }>;
  /** AI 跟进建议 */
  followUps?: string[];
  /** 消息状态 */
  status?: "normal" | "error" | "canceled"; // 服务端原始字段，不做 enum 化（仅内部映射用）
}
