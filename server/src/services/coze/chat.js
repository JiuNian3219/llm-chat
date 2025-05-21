import { client, botId as generalBotID } from "./client.js";
import { ChatEventType, ChatStatus, RoleType } from "@coze/api";

/**
 * 执行非流式的聊天请求
 * @param {string} content - 用户输入的内容
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 */
export async function nonStreamChat(content, conversationId, botId) {
  const chatResponse = await client.chat.createAndPoll({
    bot_id: botId || generalBotID,
    conversation_id: conversationId,
    additional_messages: [
      {
        role: RoleType.User,
        content: content,
        content_type: "text",
      },
    ],
  });

  const messages = [];

  if (chatResponse.chat.status === ChatStatus.COMPLETED) {
    // 筛选出 answer 和 follow_up 类型的消息
    for (const message of chatResponse.messages || []) {
      console.log(message.type);
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
 * @param {object} callbacks - 回调函数
 * @param {function} [callbacks.onStart] - 开始回调
 * @param {function} [callbacks.onMessage] - 消息回调
 * @param {function} [callbacks.onCompleted] - 完成回调
 * @param {function} [callbacks.onDone] - 完成回调
 * @param {function} [callbacks.onError] - 错误回调
 * @param {string} [conversationId] - 会话ID
 * @param {string} [botId] - 机器人ID
 */
export async function streamChat(content, callbacks, conversationId, botId) {
  const { onStart, onMessage, onCompleted, onDone, onError } = callbacks;
  const chatResponse = await client.chat.stream({
    bot_id: botId || generalBotID,
    conversation_id: conversationId,
    additional_messages: [
      {
        role: RoleType.User,
        content: content,
        content_type: "text",
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
      const { role, type } = part.data;
      if (role === "assistant" && type === "follow_up") {
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
  const chatResponse = await client.chat.cancel(
    conversationId,
    chatId,
  )
  return chatResponse;
}