import {
  ChatEventType,
  ChatStatus,
  RoleType,
  type ContentType,
} from "@coze/api";
import {
  createConversation,
  setConversationInProgress,
  updateConversationTimestamp,
  updateConversationTitle,
} from "../database/conversation.js";
import { getFilesByIds } from "../database/file.js";
import { createMessage, markChatCanceled } from "../database/message.js";
import {
  appendDelta,
  publishCompleted,
  publishDone,
  publishError,
  publishFollowUp,
  publishReasoning,
  publishStart,
} from "../stream/hub.js";
import { INFORMATION_REFINER_PROMPT } from "../utils/constants.js";
import { client, getBotId } from "./client.js";
import { getSnapshot } from "../stream/hub.js";

// 取消中的聊天记录，键为 `${conversationId}:${chatId}`
const canceledChats = new Set<string>();
function makeKey(conversationId?: string | null, chatId?: string | null) {
  return `${conversationId || ""}:${chatId || ""}`;
}

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
 * @param conversationId - 会话ID
 */
export async function streamChat(
  content: string,
  contentType: ContentType,
  conversationId: string
) {
  // 并发拦截：同一会话在进行中或文本已完成但尚未结束时，拒绝新的流式请求
  if (conversationId) {
    const snapshot = await getSnapshot(conversationId);
    if (snapshot.status === "in_progress" || snapshot.status === "completed") {
      await publishError(conversationId, "该会话正在生成中，请稍后再试");
      throw new Error("该会话正在生成中，请稍后再试");
    }
  }
  // 更新会话的时间戳，使其在会话列表的最上方
  await updateConversationTimestamp(conversationId);
  await setConversationInProgress(conversationId, true);
  await publishStart(conversationId);

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

  async function saveCanceledMessage(info: MessageInfo) {
    try {
      await createMessage({
        conversationId: info.conversationId,
        role: "assistant",
        content: info.fullContent,
        contentType: "text",
        chatId: info.chatId,
        followUps: info.followUps,
        status: "canceled",
      });
    } catch (e) {
      console.error("保存取消消息失败:", e);
    }
  }

  try {
    for await (const part of chatResponse) {
      switch (part.event) {
        case ChatEventType.CONVERSATION_CHAT_CREATED:
          messageInfo.conversationId = part.data.conversation_id;
          // onStart removed, already published start
          break;
        case ChatEventType.CONVERSATION_MESSAGE_DELTA:
          messageInfo.chatId = part.data.chat_id;
          // 若已被取消，则终止流并不保存
          if (
            canceledChats.has(
              makeKey(messageInfo.conversationId, messageInfo.chatId)
            )
          ) {
            canceledChats.delete(
              makeKey(messageInfo.conversationId, messageInfo.chatId)
            );
            await saveCanceledMessage(messageInfo);
            await publishError(messageInfo.conversationId, "对话已取消");
            return;
          }
          messageInfo.fullContent += part.data.content;
          const reasoningContent = (part.data as any)?.reasoning_content;
          if (reasoningContent) {
            await publishReasoning(messageInfo.conversationId, reasoningContent);
          }
          await appendDelta(
            messageInfo.conversationId,
            messageInfo.chatId,
            part.data.content
          );
          // onMessage removed, appendDelta publishes message
          break;
        case ChatEventType.CONVERSATION_MESSAGE_COMPLETED:
          if (["follow_up", "answer"].includes(part.data.type)) {
            // onCompleted removed
            if (part.data.type === "follow_up") {
              messageInfo.followUps.push(part.data.content);
              await publishFollowUp(messageInfo.conversationId, part.data.content);
            }
            if (part.data.type === "answer") {
              await publishCompleted(messageInfo.conversationId, part.data.content);
            }
          }
          break;
        case ChatEventType.DONE:
          // DONE 前再次判断是否已取消
          if (
            canceledChats.has(
              makeKey(messageInfo.conversationId, messageInfo.chatId)
            )
          ) {
            canceledChats.delete(
              makeKey(messageInfo.conversationId, messageInfo.chatId)
            );
            await saveCanceledMessage(messageInfo);
            await publishError(messageInfo.conversationId, "对话已取消");
            return;
          }
          // onDone removed
          saveAIMessage(messageInfo).catch((error) => {
            console.error("保存AI消息失败:", error);
          });
          await setConversationInProgress(messageInfo.conversationId, false);
          await publishDone(messageInfo.conversationId);
          break;
        case ChatEventType.ERROR:
          // 记录错误消息到数据库
          saveErrorMessage(
            messageInfo,
            part?.data?.msg || "对话服务暂时不可用"
          ).catch((error) => {
            console.error("保存错误消息失败:", error);
          });
          // onError removed
          await setConversationInProgress(messageInfo.conversationId, false);
          await publishError(
            messageInfo.conversationId,
            part?.data?.msg || "对话服务暂时不可用"
          );
          return;
      }
    }
  } catch (error: any) {
    console.error("流式聊天请求失败:", error);
    // 保存错误消息到数据库
    await saveErrorMessage(messageInfo, "对话服务暂时不可用").catch((e) => {
      console.error("保存错误消息失败:", e);
    });
    // onError removed
    await publishError(messageInfo.conversationId, "对话服务暂时不可用");
    throw error;
  }
}

/**
 * 取消聊天请求
 * @param chatId - 聊天ID
 * @param conversationId - 会话ID
 */
export async function cancelChat(chatId: string, conversationId: string) {
  // 先标记为已取消，避免流式继续入库
  canceledChats.add(makeKey(conversationId, chatId));
  const chatResponse = await client.chat.cancel(conversationId, chatId);
  if ((chatResponse as any)?.status === "canceled") {
    await markChatCanceled(conversationId, chatId);
    await setConversationInProgress(conversationId, false);
    publishError(conversationId, "对话已取消");
  }
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
export async function createNewConversation(query: string) {
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
