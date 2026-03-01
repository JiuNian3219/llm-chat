/**
 * 文件上传状态
 */
export const UploadStatus = {
  /** 正在上传 */
  Uploading: "uploading",
  /** 上传完成 */
  Done: "done",
  /** 正在取消上传 */
  Canceling: "canceling",
} as const;

export type UploadStatus = (typeof UploadStatus)[keyof typeof UploadStatus];

/**
 * 聊天中的文件项
 */
export interface ChatFile {
  /** 文件 ID */
  id: string;
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型（图片或普通文件） */
  type: "image" | "file";
  /** 上传状态 */
  status: UploadStatus;
  /** 服务器可访问地址（上传完成后存在） */
  url?: string;
  /** 浏览器 `File` 对象（本地上传时存在） */
  file?: File;
}
