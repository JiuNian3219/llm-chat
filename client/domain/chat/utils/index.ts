import { UploadStatus, type ChatFile } from "@/src/types/chat";
import { MessageStatus, type ChatMessage, type ServerMessage } from "@/src/types/message";

/**
 * 复制信息
 * @param text - 需要复制的信息
 * @param messageApi - 消息API
 * @returns
 */
export async function copyText(
  text: string,
  messageApi?: {
    success: (_msg: string) => void;
    error: (_msg: string) => void;
  }
) {
  let result = false;
  await navigator.clipboard
    .writeText(text)
    .then(() => {
      messageApi && messageApi.success("复制成功");
      result = true;
    })
    .catch(() => {
      messageApi && messageApi.error("复制失败");
      result = false;
    });
  return result;
}

/**
 * 根据文件名称获取文件类型
 * @param fileName - 文件名
 * @returns 文件类型
 */
export function getFileType(fileName: string): string {
  if (!fileName || typeof fileName !== "string") {
    return "";
  }
  return (fileName.split(".").pop() || "").toLowerCase();
}

/**
 * 判断文件类型是否为图片
 * @param type - 文件类型
 * @returns 是否为图片类型
 */
export function isImageType(type: string): boolean {
  if (!type || typeof type !== "string") {
    return false;
  }
  return type.toLocaleLowerCase().startsWith("image/");
}

/**
 * 根据文件名称获取格式化后的文件类型
 * @param fileName - 文件名
 * @returns 格式化后的文件类型
 */
export function getFormattedFileType(fileName: string): string {
  const fileType = getFileType(fileName);
  return fileType ? fileType.toUpperCase() : "未知类型";
}

/**
 * 根据文件大小做单位转换，并返回格式化后的字符串
 * @param size 文件大小，单位为字节
 * @returns 转换后的文件大小字符串，保留两位小数
 */
export function formatFileSize(size: number): string {
  if (size < 0 || typeof size !== "number") {
    return "未知大小";
  }
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(2)} ${units[index]}`;
}

/**
 * 生成多模态信息
 * @param text - 文本内容
 * @param files - 文件列表
 * @returns 多模态信息
 */
export function generateMultimodalMessage(
  text: string,
  files: ChatFile[]
): string {
  if (!text || !files || files.length === 0) {
    return "";
  }
  const messageList = [];
  for (const file of files) {
    messageList.push({
      file_id: file.id,
      type: file.type,
    });
  }
  messageList.push({
    type: "text",
    text: text,
  });
  return JSON.stringify(messageList);
}

/**
 * 格式化服务器对话信息
 * @param messages - 服务器返回的对话信息列表
 * @returns
 */
export function formatServerMessages(messages: ServerMessage[]): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  return messages.map((message: ServerMessage) => {
    const { role, contentType, content, files, followUps, status } = message;

    const msgStatus: MessageStatus =
      status === "canceled" ? MessageStatus.Canceled
      : status === "error" ? MessageStatus.Error
      : MessageStatus.Completed;

    const newMessage: ChatMessage = {
      id: message._id,
      chatId: message.chatId,
      role,
      content,
      followUps: followUps || [],
      status: msgStatus,
      files: [] as ChatFile[],
    };
    if (contentType === "object_string" && content) {
      const parsedContent: any[] = JSON.parse(content).filter(
        (item: any) => item.type == "text"
      );
      newMessage.content =
        parsedContent.length > 0 ? parsedContent[0].text : "";
      newMessage.files = files.map((file: any) => ({
        id: file.fileId,
        name: file.originalname,
        size: file.size,
        url: `${(import.meta as any).env.VITE_API_BASE_URL || ""}${file.url}`,
        type: file.isImage ? "image" : "file",
        status: UploadStatus.Done,
      }));
    }
    return newMessage;
  });
}
