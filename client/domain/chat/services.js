import request from "@/base/utils/request";
import api from "@/domain/chat/const/api";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const { coze } = api;

/**
 * 执行流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {Object} callbacks - 回调函数
 * @param {Function} [callbacks.onStart] - 开始回调
 * @param {Function} [callbacks.onMessage] - 消息回调
 * @param {Function} [callbacks.onCompleted] - 完成回调
 * @param {Function} [callbacks.onDone] - 完成回调
 * @param {Function} [callbacks.onError] - 错误回调
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 */
function streamChatByCoze(content, callbacks, conversationId, botId) {
  try {
    const { onStart, onMessage, onCompleted, onDone, onError } = callbacks;
    if (!content) {
      return Promise.reject(new Error("content不能为空"));
    }
    const { url, method } = coze.streamingChat;
    const controller = new AbortController();

    fetchEventSource(url, {
      method,
      body: JSON.stringify({
        content,
        conversationId,
        botId,
      }),
      headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
      },
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
    })
    // 返回一个取消函数，用于取消请求接收
    return () => {
        controller.abort();
    }
  } catch (error) {
    // 暂时还没做好系统的错误处理
    console.error("流式聊天请求错误:", error);
  }
}

/**
 * 执行非流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 * @returns
 */
function nonStreamChatByCoze(content, conversationId, botId) {
  if (!content) {
    return Promise.reject(new Error("content不能为空"));
  }
  const { url, method } = coze.nonStreamingChat;
  return request(url, {
    method,
    data: {
      content,
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

export default {
  streamChatByCoze,
  nonStreamChatByCoze,
  cancelChatByCoze,
};
