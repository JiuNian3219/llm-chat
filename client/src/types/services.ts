/**
 * 内容类型
 * - text: 纯文本
 * - object_string: 多模态 JSON 字符串
 */
export type ContentType = "text" | "object_string";

/**
 * 流式聊天回调
 * - onStart: 流开始时（提供 `conversation_id`）
 * - onMessage: 每次增量消息（含 content 或 reasoning）
 * - onCompleted: 本轮消息完成
 * - onFollowUp: AI 的跟进建议
 * - onDone: 整体结束（结束 SSE）
 * - onError: 错误回调
 */
export interface StreamChatCallbacks {
  onStart?: (_data: any) => void;
  onMessage?: (_data: any) => void;
  onCompleted?: (_data: any) => void;
  onFollowUp?: (_data: any) => void;
  onDone?: (_data: any) => void;
  onError?: (_error: any) => void;
}

/**
 * 上传文件响应体
 * - id: 文件 ID
 * - originalname: 原始文件名
 * - size: 文件大小（字节）
 * - url: 上传后的文件 URL
 */
export interface UploadResponse {
  id: string;
  originalname: string;
  size: number;
  url: string;
}

/**
 * 取消上传响应体
 * - status: 取消状态（"canceled" 或 "error"）
 * - message: 取消消息（可选）
 */
export interface CancelResponse {
  status: "canceled" | "error";
  message?: string;
}
