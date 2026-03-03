import type { ContentType } from "@coze/api";
import mongoose from "mongoose";
import Message from "../../models/message.js";

/**
 * 创建消息记录
 * @param messageData - 消息数据
 * @param conversationId - 关联的会话ID
 * @param role - 消息角色, "user" 或 "assistant"
 * @param content - 消息内容
 * @param contentType - 内容类型, "text", "object_string"
 * @param followUps - 后续问题
 * @param files - 关联的文件列表
 * @param chatId - COZE返回的聊天ID
 * @param status - COZE信息的状态
 */
export const createMessage = async ({
  conversationId,
  role,
  content,
  contentType,
  followUps,
  files,
  chatId,
  status,
}: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  contentType: ContentType;
  followUps?: string[];
  files?: any[];
  chatId?: string | null;
  status?: "normal" | "error" | "canceled";
}) => {
  const message = new Message({
    conversationId,
    role,
    content,
    contentType: contentType || "text",
    followUps: followUps,
    files: files,
    chatId,
    status: status || "normal",
  });
  await message.save();
  return message;
};

/**
 * 获取同会话下的所有消息
 * @param conversationId - 会话ID
 */
export const getMessagesByConversationId = async (conversationId: string) => {
  // 获取同一会话下的所有消息，并按创建时间排序，旧的在前，新的在后
  const messages = await Message.find({ conversationId })
    .populate("files")
    .sort({ createdAt: 1 })
    .lean();
  return messages;
};

/**
 * 游标分页获取消息（按需加载）
 * @param conversationId - 会话ID
 * @param options.limit  - 每页条数（默认 10，最大 50）
 * @param options.before - 游标：ObjectId 字符串，仅返回该 ID 之前的消息
 * @returns messages（按时间正序）+ hasMore 标志
 */
export const getMessagesPaginated = async (
  conversationId: string,
  { limit = 10, before }: { limit?: number; before?: string } = {}
) => {
  const query: Record<string, any> = { conversationId };
  if (before) {
    // ObjectId 天然携带时间信息，$lt 等价于"更早的消息"
    query._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  // 多取 1 条用于判断是否还有更多
  const rows = await Message.find(query)
    .populate("files")
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rows.length > limit;
  // 截取目标条数后翻转为正序（旧 → 新）
  return { messages: rows.slice(0, limit).reverse(), hasMore };
};

/**
 * 删除消息记录
 * @param messageId - 消息ID
 */
export const deleteMessage = async (messageId: string) => {
  const message = await Message.findOneAndDelete({ messageId });
  if (!message) {
    throw new Error(`消息记录不存在`);
  }
};

export const markChatCanceled = async (
  conversationId: string,
  chatId: string
) => {
  if (!conversationId || !chatId) return;
  const existing = await Message.findOne({
    conversationId,
    chatId,
    role: "assistant",
  });
  if (existing) {
    await Message.updateOne({ _id: existing._id }, { $set: { status: "canceled" } });
    return;
  }
  const message = new Message({
    conversationId,
    chatId,
    role: "assistant",
    content: "",
    contentType: "text",
    followUps: [],
    status: "canceled",
  });
  await message.save();
};
