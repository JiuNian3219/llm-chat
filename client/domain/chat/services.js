import request from "@/base/utils/request";
import api from "@/domain/chat/const/api";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const { coze } = api;

/**
 * 执行流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {string} contentType - 内容类型, "text", "object_string"
 * @param {Object} callbacks - 回调函数
 * @param {Function} [callbacks.onStart] - 开始回调
 * @param {Function} [callbacks.onMessage] - 消息回调
 * @param {Function} [callbacks.onCompleted] - 完成回调
 * @param {Function} [callbacks.onFollowUp] - 后续建议回调
 * @param {Function} [callbacks.onDone] - 完成回调
 * @param {Function} [callbacks.onError] - 错误回调
 * @param {string} [conversationId] - 会话ID
 */
function streamChatByCoze(
  content,
  contentType,
  callbacks,
  conversationId,
) {
  try {
    const { onStart, onMessage, onCompleted, onFollowUp, onDone, onError } =
      callbacks;
    if (!content) {
      return Promise.reject(new Error("content不能为空"));
    }
    const { url, method } = coze.streamingChat;
    const controller = new AbortController();

    // @ts-ignore
    fetchEventSource(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
      method,
      body: JSON.stringify({
        content,
        contentType,
        conversationId,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      openWhenHidden: true, // 确保在后台也能接收消息
      signal: controller.signal,
      onmessage: (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "start":
            onStart && onStart(data);
            break;
          case "message":
            onMessage && onMessage(data);
            break;
          case "completed":
            onCompleted && onCompleted(data);
            break;
          case "follow_up":
            onFollowUp && onFollowUp(data);
            break;
          case "done":
            onDone && onDone(data);
            // 关闭连接
            controller.abort();
            break;
          case "error":
            onError && onError(data);
            break;
        }
      },
      onerror: (error) => {
        onError && onError(error);
        controller.abort();
      },
    });
    // 返回一个取消函数，用于取消请求接收
    return () => {
      controller.abort();
    };
  } catch (error) {
    // 暂时还没做好系统的错误处理
    console.error("流式聊天请求错误:", error);
  }
}

/**
 * 执行非流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {string} contentType - 内容类型, "text", "object_string"
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 * @returns
 */
function nonStreamChatByCoze(content, contentType, conversationId, botId) {
  if (!content) {
    return Promise.reject(new Error("content不能为空"));
  }
  const { url, method } = coze.nonStreamingChat;
  return request(url, {
    method,
    data: {
      content,
      contentType,
      conversationId,
      botId,
    },
  });
}

/**
 * 取消聊天
 * @param {string} conversationId - 会话ID
 * @param {string} chatId - 聊天ID
 * @returns
 */
function cancelChatByCoze(conversationId, chatId) {
  if (!conversationId || !chatId) {
    return Promise.reject(new Error("conversationId和chatId不能为空"));
  }
  const { url, method } = coze.cancelChat;
  return request(url, {
    method,
    data: {
      conversationId,
      chatId,
    },
  });
}

/**
 * 上传文件
 * @param {File} file - 文件对象
 * @param {string} conversationId - 会话ID
 */
function uploadFileByCoze(file, conversationId) {
  if (!file) {
    return Promise.reject(new Error("file不能为空"));
  }
  const { url, method } = coze.upload;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversationId", conversationId);

  return request(url, {
    method,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/**
 * 取消文件上传
 * @param {string} fileId - 文件ID
 * @param {string} filename - 文件名
 */
function cancelFileUploadByCoze(fileId, filename) {
  if (!fileId || !filename) {
    return Promise.reject(new Error("fileId和filename不能为空"));
  }
  const { url, method } = coze.cancelUpload;
  return request(url, {
    method,
    data: {
      fileId,
      filename,
    },
  });
}

/**
 * 获取所有会话列表
 */
function getAllConversationList() {
  const { url, method } = coze.conversationAll;
  return request(url, {
    method,
  });
}

/**
 * 获取会话列表
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=20] - 每页大小
 */
function getConversationList(page = 1, pageSize = 20) {
  const { url, method } = coze.conversationList;
  return request(url, {
    method,
    params: {
      page,
      pageSize,
    },
  });
}

/**
 * 获取会话详情
 * @param {string} conversationId - 会话ID
 */
function getConversationDetail(conversationId) {
  const { url, method } = coze.conversationDetail;
  return request(url, {
    method,
    params: {
      id: conversationId,
    },
  });
}

/**
 * 获取会话标题
 * @param {string} conversationId - 会话ID
 */
function getConversationTitle(conversationId) {
  const { url, method } = coze.conversationTitle;
  return request(url, {
    method,
    params: {
      id: conversationId,
    },
  });
}

export default {
  streamChatByCoze,
  nonStreamChatByCoze,
  cancelChatByCoze,
  uploadFileByCoze,
  cancelFileUploadByCoze,
  getAllConversationList,
  getConversationList,
  getConversationDetail,
  getConversationTitle,
};
