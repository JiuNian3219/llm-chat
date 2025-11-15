import type { ChatFile } from "./chat";

/**
 * 消息角色
 * - user: 用户消息
 * - assistant: AI 助手消息
 */
export type Role = "user" | "assistant";

/**
 * 前端消息结构
 * - id: 前端消息唯一标识（与后端 `_id` 对应）
 * - role: 消息角色
 * - content: 文本内容（当为多模态时为解析后的纯文本）
 * - chatId: 会话内单次聊天标识（用于取消流式）
 * - conversationId: 会话标识
 * - isLoading/isCancel/isError: 消息状态标记
 * - followUps: AI 跟进建议
 * - files: 上传的文件列表（上传完成后为后端返回的文件项）
 */
export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  chatId: string | null;
  conversationId?: string;
  isLoading?: boolean;
  isCancel?: boolean;
  isError?: boolean;
  followUps?: string[];
  files?: ChatFile[];
}

/**
 * 后端消息结构（原始）
 * - contentType: 文本或多模态字符串（`object_string`）
 * - files: 附件的简要信息（用于前端拼装 `ChatFile`）
 * - status: 消息状态，错误时为 `error`
 */
export interface ServerMessage {
  _id: string;
  chatId: string | null;
  role: Role;
  content: string;
  contentType: "text" | "object_string";
  files: Array<{
    fileId: string;
    originalname: string;
    size: number;
    url: string;
    isImage: boolean;
  }>;
  followUps?: string[];
  status?: "normal" | "error" | "canceled";
}