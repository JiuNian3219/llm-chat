import request from "@/base/utils/request";
import api from "@/domain/chat/const/api";
import type {
  CancelResponse,
  ContentType,
  StreamChatCallbacks,
  UploadResponse,
} from "@/src/types/services";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const { coze } = api;

/**
 * 执行流式的聊天请求
 * @param content - 用户输入的内容
 * @param contentType - 内容类型, "text", "object_string"
 * @param callbacks - 回调函数
 * @param callbacks.onStart - 开始回调
 * @param callbacks.onMessage - 消息回调
 * @param callbacks.onCompleted - 完成回调
 * @param callbacks.onFollowUp - 后续建议回调
 * @param callbacks.onDone - 完成回调
 * @param callbacks.onError - 错误回调
 * @param conversationId - 会话ID
 */
function streamChatByCoze(
  content: string,
  contentType: ContentType,
  callbacks: StreamChatCallbacks,
  conversationId?: string
) {
  try {
    const { onStart, onMessage, onCompleted, onFollowUp, onDone, onError } =
      callbacks;
    if (!content) {
      throw new Error("content不能为空");
    }
    const { url, method } = coze.streamingChat;
    const controller = new AbortController();

    fetchEventSource(`${(import.meta as any).env.VITE_API_BASE_URL}${url}`, {
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
  } catch (error: any) {
    const message = error?.message || "AI对话发生错误，请稍后再试";
    callbacks?.onError?.({ message });
    return;
  }
}

/**
 * 执行非流式的聊天请求
 * @param content - 用户输入的内容
 * @param contentType - 内容类型, "text", "object_string"
 * @param conversationId - 会话ID
 * @param botId - 机器人ID
 * @returns
 */
function nonStreamChatByCoze(
  content: string,
  contentType: ContentType,
  conversationId?: string,
  botId?: string
) {
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
 * @param conversationId - 会话ID
 * @param chatId - 聊天ID
 * @returns
 */
function cancelChatByCoze(conversationId: string, chatId: string) {
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
 * @param file - 文件对象
 * @param conversationId - 会话ID
 */
function uploadFileByCoze(file: File, conversationId: string) {
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
  }) as Promise<{ data: UploadResponse }>;
}

/**
 * 取消文件上传
 * @param fileId - 文件ID
 * @param filename - 文件名
 */
function cancelFileUploadByCoze(fileId: string, filename: string) {
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
  }) as Promise<{ data: CancelResponse }>;
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
 * @param page - 页码
 * @param pageSize - 每页大小
 */
function getConversationList(page: number = 1, pageSize: number = 20) {
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
 * @param conversationId - 会话ID
 */
function getConversationDetail(conversationId: string) {
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
 * @param conversationId - 会话ID
 */
function getConversationTitle(conversationId: string) {
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
