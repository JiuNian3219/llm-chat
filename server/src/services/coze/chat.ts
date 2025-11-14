import {
  ChatEventType,
  ChatStatus,
  RoleType,
  type ContentType,
} from "@coze/api";
import {
  createConversation,
  updateConversationTimestamp,
  updateConversationTitle,
} from "../database/conversation.js";
import { getFilesByIds } from "../database/file.js";
import { createMessage } from "../database/message.js";
import { INFORMATION_REFINER_PROMPT } from "../utils/constants.js";
import { client, getBotId } from "./client.js";

interface MessageInfo {
  conversationId: string;
  chatId: string | null;
  fullContent: string;
  followUps: string[];
}

/**
 * 执行非流式的聊天请求
 * @param content - 用户输入的内容
 * @param contentType - 内容类型, "text", "object_string"
 * @param conversationId - 会话ID
 */
export async function nonStreamChat(
  content: string,
  contentType: ContentType,
  conversationId?: string
) {
  const chatResponse = await client.chat.createAndPoll({
    bot_id: getBotId(),
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
 * @param content - 用户输入的内容
 * @param contentType - 内容类型, "text", "object_string"
 * @param callbacks - 回调函数
 * @param callbacks.onStart - 开始回调
 * @param callbacks.onMessage - 消息回调
 * @param callbacks.onCompleted - 完成回调
 * @param callbacks.onDone - 完成回调
 * @param callbacks.onError - 错误回调
 * @param conversationId - 会话ID
 */
export async function streamChat(
  content: string,
  contentType: ContentType,
  callbacks: {
    onStart?: (data: any) => void;
    onMessage?: (data: any) => void;
    onCompleted?: (data: any) => void;
    onDone?: (data: any) => void;
    onError?: (error: any) => void;
  },
  conversationId?: string
) {
  if (!conversationId) {
    // 如果没有提供会话ID，则创建一个新的会话
    conversationId = await createNewConversation(content);
  }
  // 更新会话的时间戳，使其在会话列表的最上方
  await updateConversationTimestamp(conversationId);
  const { onStart, onMessage, onCompleted, onDone, onError } = callbacks;

  // 创建用户消息记录
  createMessage({
    conversationId: conversationId,
    role: "user",
    content: content,
    contentType: contentType,
    files: await getFilesFromContent(content, contentType),
  }).catch((error) => {
    console.error("创建用户消息记录失败:", error);
  });

  const chatResponse = await client.chat.stream({
    bot_id: getBotId(),
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

  let messageInfo: MessageInfo = {
    conversationId,
    chatId: null,
    fullContent: "",
    followUps: [],
  };

  try {
    for await (const part of chatResponse) {
      switch (part.event) {
        case ChatEventType.CONVERSATION_CHAT_CREATED:
          messageInfo.conversationId = part.data.conversation_id;
          onStart?.(part.data);
          break;
        case ChatEventType.CONVERSATION_MESSAGE_DELTA:
          messageInfo.chatId = part.data.chat_id;
          messageInfo.fullContent += part.data.content;
          onMessage?.(part.data);
          break;
        case ChatEventType.CONVERSATION_MESSAGE_COMPLETED:
          if (["follow_up", "answer"].includes(part.data.type)) {
            onCompleted?.(part.data);
            if (part.data.type === "follow_up") {
              messageInfo.followUps.push(part.data.content);
            }
          }
          break;
        case ChatEventType.DONE:
          onDone?.({ content: messageInfo.fullContent });
          saveAIMessage(messageInfo).catch((error) => {
            console.error("保存AI消息失败:", error);
          });
          break;
        case ChatEventType.ERROR:
          // 记录错误消息到数据库
          saveErrorMessage(
            messageInfo,
            part?.data?.msg || "对话服务暂时不可用"
          ).catch((error) => {
            console.error("保存错误消息失败:", error);
          });
          onError?.(part.data);
          return;
      }
    }
  } catch (error: any) {
    console.error("流式聊天请求失败:", error);
    // 保存错误消息到数据库
    await saveErrorMessage(messageInfo, "对话服务暂时不可用").catch((e) => {
      console.error("保存错误消息失败:", e);
    });
    onError?.({ msg: "对话服务暂时不可用" });
    throw error;
  }
}

/**
 * 取消聊天请求
 * @param chatId - 聊天ID
 * @param conversationId - 会话ID
 */
export async function cancelChat(chatId: string, conversationId: string) {
  const chatResponse = await client.chat.cancel(conversationId, chatId);
  return chatResponse;
}

/**
 * 生成会话标题
 * @param content - 用户输入的内容
 * @returns
 */
async function generateConversationTitle(content: string) {
  const query = INFORMATION_REFINER_PROMPT + content;
  const messages = (await nonStreamChat(query, "text")).filter(
    (message) => message.type === "answer"
  );
  return messages.length > 0 ? messages[0].content.trim() : "新会话";
}

/**
 * 从内容中提取文件ID
 * @param content - 内容字符串
 * @param contentType - 内容类型, "text", "object_string"
 * @returns
 */
async function getFilesFromContent(content: string, contentType: ContentType) {
  if (contentType !== "object_string") {
    return [];
  }
  if (!content || typeof content !== "string") {
    console.warn("无效的content:", content);
    return [];
  }
  if (contentType === "object_string") {
    try {
      const parsedContent: any[] = JSON.parse(content);
      const fileIds = parsedContent
        .filter((item: any) => item.type !== "text")
        .map((item: any) => item.file_id);
      if (fileIds.length === 0) {
        return [];
      }
      return (await getFilesByIds(fileIds)).map((file) => file._id);
    } catch (error: any) {
      console.error("解析内容失败:", error);
      return [];
    }
  }
}

/**
 * 创建新的会话
 * @param query - 用于生成会话标题的查询内容
 * @returns
 */
async function createNewConversation(query: string) {
  const conversation = await client.conversations.create({
    bot_id: getBotId(),
  });
  await createConversation(conversation.id, "新对话", false);
  generateConversationTitle(query)
    .then((title) => {
      updateConversationTitle(conversation.id, title);
    })
    .catch((error) => {
      console.error("生成会话标题失败:", error);
    });
  return conversation.id;
}

/**
 * 保存AI消息到数据库
 * @param messageInfo - 消息信息
 */
async function saveAIMessage(messageInfo: MessageInfo) {
  await createMessage({
    conversationId: messageInfo.conversationId,
    role: "assistant",
    content: messageInfo.fullContent,
    contentType: "text",
    chatId: messageInfo.chatId,
    followUps: messageInfo.followUps,
  });
}

/**
 * 保存错误消息到数据库
 * @param {Object} messageInfo - 消息信息
 * @param {string} errorText - 错误文本
 */
async function saveErrorMessage(messageInfo: MessageInfo, errorText: string) {
  await createMessage({
    conversationId: messageInfo.conversationId,
    role: "assistant",
    content: errorText,
    contentType: "text",
    chatId: messageInfo.chatId,
    followUps: messageInfo.followUps,
    status: "error",
  });
}
