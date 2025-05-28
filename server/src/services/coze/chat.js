import { client, botId as generalBotID } from "./client.js";
import { ChatEventType, ChatStatus, RoleType } from "@coze/api";

/**
 * 执行非流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {import("@coze/api").ContentType} contentType - 内容类型, "text", "object_string"
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 */
export async function nonStreamChat(content, contentType, conversationId, botId) {
  const chatResponse = await client.chat.createAndPoll({
    bot_id: botId || generalBotID,
    conversation_id: conversationId,
    auto_save_history: true,
    additional_messages: [
      {
        role: RoleType.User,
        content: content,
        content_type: contentType,
      },
    ],
  });

  const messages = [];

  if (chatResponse.chat.status === ChatStatus.COMPLETED) {
    // 筛选出 answer 和 follow_up 类型的消息
    for (const message of chatResponse.messages || []) {
      if (["answer", "follow_up"].includes(message.type)) {
        messages.push(message);
      }
    }
  }
  return messages;
}

/**
 * 执行流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {import("@coze/api").ContentType} contentType - 内容类型, "text", "object_string"
 * @param {object} callbacks - 回调函数
 * @param {function} [callbacks.onStart] - 开始回调
 * @param {function} [callbacks.onMessage] - 消息回调
 * @param {function} [callbacks.onCompleted] - 完成回调
 * @param {function} [callbacks.onDone] - 完成回调
 * @param {function} [callbacks.onError] - 错误回调
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 */
export async function streamChat(content, contentType, callbacks, conversationId, botId) {
  const { onStart, onMessage, onCompleted, onDone, onError } = callbacks;
  const chatResponse = await client.chat.stream({
    bot_id: botId || generalBotID,
    conversation_id: conversationId,
    auto_save_history: true,
    additional_messages: [
      {
        role: RoleType.User,
        content: content,
        content_type: contentType,
      },
    ],
  });

  let fullResponse = "";

  for await (const part of chatResponse) {
    if (part.event === ChatEventType.CONVERSATION_CHAT_CREATED) {
      onStart && onStart(part.data);
    } else if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
      onMessage && onMessage(part.data);
      fullResponse += part.data.content;
    } else if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED) {
      const { type } = part.data;
      if (type === "follow_up" || type === "answer") {
        onCompleted && onCompleted(part.data);
      }
    } else if (part.event === ChatEventType.DONE) {
      onDone && onDone({ content: fullResponse });
    } else if (part.event === ChatEventType.ERROR) {
      onError && onError(part.data);
    }
  }
}

/**
 * 取消聊天请求
 * @param {string} chatId
 * @param {string} conversationId
 */
export async function cancelChat(chatId, conversationId) {
  const chatResponse = await client.chat.cancel(conversationId, chatId);
  return chatResponse;
}