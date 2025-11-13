/**
 * 复制信息
 * @param {string} text - 需要复制的信息
 * @param {object} messageApi - 消息API
 * @returns
 */
export async function copyText(text, messageApi) {
  let result = false;
  await navigator.clipboard
    .writeText(text)
    .then(() => {
      messageApi && messageApi.success("复制成功");
      result = true;
    })
    .catch((err) => {
      messageApi && messageApi.error("复制失败");
      result = false;
    });
  return result;
}

/**
 * 根据文件名称获取文件类型
 * @param {string} fileName - 文件名
 * @returns {string} 文件类型
 */
export function getFileType(fileName) {
  if (!fileName || typeof fileName !== "string") {
    return "";
  }
  return fileName.split(".").pop().toLowerCase();
}

/**
 * 判断文件类型是否为图片
 * @param {string} type - 文件类型
 * @returns {boolean} 是否为图片类型
 */
export function isImageType(type) {
  if (!type || typeof type !== "string") {
    return false;
  }
  return type.toLocaleLowerCase().startsWith("image/");
}

/**
 * 根据文件名称获取格式化后的文件类型
 * @param {string} fileName - 文件名
 * @returns {string} 格式化后的文件类型
 */
export function getFormattedFileType(fileName) {
  const fileType = getFileType(fileName);
  return fileType ? fileType.toUpperCase() : "未知类型";
}

/**
 * 根据文件大小做单位转换，并返回格式化后的字符串
 * @param {number} size 文件大小，单位为字节
 * @returns {string} 转换后的文件大小字符串，保留两位小数
 */
export function formatFileSize(size) {
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
 * @param {string} text - 文本内容
 * @param {Array<object>} files - 文件列表
 * @returns {string} 多模态信息
 */
export function generateMultimodalMessage(text, files) {
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
 * @param {Array<object>} messages - 服务器返回的对话信息列表
 * @returns
 */
export function formatServerMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  return messages.map((message) => {
    const { role, contentType, content, files, followUps, status } = message;
    const newMessage = {
      id: message._id,
      chatId: message.chatId,
      role,
      content,
      followUps,
      isLoading: false,
      isCancel: false,
      isError: status === "error",
      files: [],
    };
    if (contentType === "object_string" && content) {
      const parsedContent = JSON.parse(content).filter(
        (item) => item.type == "text"
      );
      newMessage.content =
        parsedContent.length > 0 ? parsedContent[0].text : "";
      newMessage.files = files.map((file) => ({
        id: file.fileId,
        name: file.originalname,
        size: file.size,
        // @ts-ignore
        url: `${import.meta.env.VITE_API_BASE_URL || ""}${file.url}`,
        type: file.isImage ? "image" : "file",
        status: "done",
      }));
    }
    return newMessage;
  });
}
