/**
 * 内容类型
 * - text: 纯文本
 * - object_string: 多模态 JSON 字符串
 */
export type ContentType = "text" | "object_string";

// ─── SSE 事件数据结构 ────────────────────────────────────────────────────────

export interface SSEStartData {
  type: "start";
  /** 会话 ID */
  conversationId: string;
  /** 断线重连时由后端携带，用于立即恢复 currentChatId，避免按钮短暂转圈 */
  chatId?: string | null;
}

export interface SSEMessageData {
  type: "message";
  /** 消息内容 */
  content: string;
  /** 会话内单次聊天标识（用于取消流式） */
  chatId?: string;
}

export interface SSESnapshotData {
  type: "snapshot";
  /** 截至当前的全量文本内容（断线重连时由后端下发，用于恢复进度） */
  content: string;
}

export interface SSECompletedData {
  type: "completed";
}

export interface SSEFollowUpData {
  type: "follow_up";
  /** AI 跟进建议 */
  content: string;
}

export interface SSEDoneData {
  type: "done";
}

export interface SSEErrorData {
  type: "error";
  /** 错误信息，由服务端 sendSSEError 统一保证 */
  error: string;
}

/**
 * SSE 事件数据
 */
export type SSEEventData =
  | SSEStartData
  | SSEMessageData
  | SSESnapshotData
  | SSECompletedData
  | SSEFollowUpData
  | SSEDoneData
  | SSEErrorData;

/**
 * 流式聊天回调
 */
export interface StreamChatCallbacks {
  /** 流开始时（提供 conversationId） */
  onStart?: (_data: SSEStartData) => void;
  /** 每次增量消息（含 content / chatId） */
  onSnapshot?: (_data: SSESnapshotData) => void;
  /** 每次增量消息（含 content / chatId） */
  onMessage?: (_data: SSEMessageData) => void;
  /** 本轮文本生成完毕 */
  onCompleted?: (_data: SSECompletedData) => void;
  /** AI 的跟进建议 */
  onFollowUp?: (_data: SSEFollowUpData) => void;
  /** 整体结束（SSE 关闭） */
  onDone?: (_data: SSEDoneData) => void;
  /** 错误回调 */
  onError?: (_error: SSEErrorData) => void;
}

/**
 * 上传文件响应体
 */
export interface UploadResponse {
  /** 文件 ID */
  id: string;
  /** 原始文件名 */
  originalname: string;
  /** 文件大小（字节） */
  size: number;
  /** 上传后的文件 URL */
  url: string;
}

/**
 * 取消上传响应体
 */
export interface CancelResponse {
  /** 取消状态 */
  status: "canceled" | "error";
  /** 取消消息 */
  message?: string;
}
