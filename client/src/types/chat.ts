/**
 * 文件上传状态
 * - uploading: 正在上传
 * - done: 上传完成
 * - canceling: 正在取消上传
 */
export type UploadStatus = "uploading" | "done" | "canceling";

/**
 * 聊天中的文件项
 * - name: 文件名
 * - size: 文件大小（字节）
 * - type: 文件类型（图片或普通文件）
 * - status: 上传状态
 * - url: 服务器可访问地址（上传完成后存在）
 * - file: 浏览器 `File` 对象（本地上传时存在）
 */
export interface ChatFile {
  id: string;
  name: string;
  size: number;
  type: "image" | "file";
  status: UploadStatus;
  url?: string;
  file?: File;
}
