import request from "@/base/utils/request";
import api from "@/domain/chat/const/api";
import type {
  CancelResponse,
  ContentType,
  SSEEventData,
  StreamChatCallbacks,
  UploadResponse,
} from "@/src/types/services";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const { coze } = api;

/**
 * 建立 SSE 连接的底层工具函数。
 * 解析 `event.data`，按 type 分发到对应回调，并在 done/error 时自动关闭连接。
 *
 * @param url - 请求URL
 * @param method - 请求方法
 * @param body - 请求体
 * @param callbacks - 回调函数
 * @param fallbackErrorMsg - 默认错误消息
 * @returns 取消函数；抛出异常时通过 onError 回调传递并返回 undefined
 */
function openSSEConnection(
  url: string,
  method: string,
  body: Record<string, unknown>,
  callbacks: StreamChatCallbacks,
  fallbackErrorMsg: string,
): (() => void) | undefined {
  try {
    const {
      onStart,
      onSnapshot,
      onMessage,
      onCompleted,
      onFollowUp,
      onDone,
      onError,
    } = callbacks;
    const controller = new AbortController();

    fetchEventSource(`${(import.meta as any).env.VITE_API_BASE_URL}${url}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      openWhenHidden: true,
      signal: controller.signal,
      onmessage: (event) => {
        const data: SSEEventData = JSON.parse(event.data);
        switch (data.type) {
          case "start":
            onStart?.(data);
            break;
          case "snapshot":
            onSnapshot?.(data);
            break;
          case "message":
            onMessage?.(data);
            break;
          case "completed":
            onCompleted?.(data);
            break;
          case "follow_up":
            onFollowUp?.(data);
            break;
          case "done":
            onDone?.(data);
            controller.abort();
            break;
          case "error":
            onError?.(data);
            controller.abort();
            break;
        }
      },
      // 必须 throw，否则 fetchEventSource 会在 onerror 返回后自动重试
      onerror: (error) => {
        onError?.(error);
        throw error;
      },
    }).catch(() => {});

    return () => controller.abort();
  } catch (error: any) {
    callbacks.onError?.({
      type: "error",
      error: error?.message || fallbackErrorMsg,
    });
    return undefined;
  }
}

/**
 * 执行流式聊天请求
 * @param content - 用户输入的内容
 * @param contentType - 内容类型, "text", "object_string"
 * @param callbacks - 回调函数
 * @param conversationId - 会话ID
 * @returns 取消函数；抛出异常时通过 onError 回调传递并返回 undefined
 */
function streamChatByCoze(
  content: string,
  contentType: ContentType,
  callbacks: StreamChatCallbacks,
  conversationId?: string,
): (() => void) | undefined {
  if (!content) {
    callbacks.onError?.({ type: "error", error: "content不能为空" });
    return undefined;
  }
  const { url, method } = coze.streamingChat;
  return openSSEConnection(
    url,
    method,
    { content, contentType, conversationId },
    callbacks,
    "AI对话发生错误，请稍后再试",
  );
}

/**
 * 订阅会话的流式输出（断线续播）
 *
 * @param conversationId - 会话ID
 * @param callbacks - 回调函数
 * @returns 取消函数；抛出异常时通过 onError 回调传递并返回 undefined
 */
function subscribeChatByConversation(
  conversationId: string,
  callbacks: StreamChatCallbacks,
): (() => void) | undefined {
  if (!conversationId) {
    callbacks.onError?.({ type: "error", error: "conversationId不能为空" });
    return undefined;
  }
  const { url, method } = coze.subscribeChat;
  return openSSEConnection(
    url,
    method,
    { conversationId },
    callbacks,
    "订阅会话输出失败，请稍后再试",
  );
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
  botId?: string,
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

/**
 * 更新会话标题
 * @param conversationId - 会话ID
 * @param title - 新标题
 */
function updateConversationTitle(conversationId: string, title: string) {
  const { url, method } = coze.conversationUpdateTitle;
  return request(url, {
    method,
    params: { id: conversationId },
    data: { title },
  });
}

/**
 * 删除会话
 * @param conversationId - 会话ID
 */
function deleteConversation(conversationId: string) {
  const { url, method } = coze.conversationDelete;
  return request(url, {
    method,
    params: { id: conversationId },
  });
}

export default {
  streamChatByCoze,
  subscribeChatByConversation,
  nonStreamChatByCoze,
  cancelChatByCoze,
  uploadFileByCoze,
  cancelFileUploadByCoze,
  getAllConversationList,
  getConversationList,
  getConversationDetail,
  getConversationTitle,
  updateConversationTitle,
  deleteConversation,
};
