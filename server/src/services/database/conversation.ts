import Conversation from "../../models/conversation.js";
import Message from "../../models/message.js";
import { NotFoundError } from "../../utils/error.js";
import { getMessagesByConversationId, getMessagesPaginated } from "./message.js";

/**
 * 在数据库中创建一个新的会话
 * @param conversationId - 会话ID
 * @param title - 会话标题
 * @param titleReady - 标题是否就绪
 * @returns
 */
export const createConversation = async (
  conversationId: string,
  title: string,
  titleReady: boolean = false
) => {
  const conversation = new Conversation({
    conversationId,
    title: title,
    titleReady,
    inProgress: false,
  });
  await conversation.save();
  return conversation.toObject();
};

/**
 * 获取所有的会话列表
 * @returns
 */
export const getAllConversations = async () => {
  const conversations = await Conversation.find({})
    .sort({ updatedAt: -1 })
    .lean();
  return conversations;
};

/**
 * 获取分页的会话列表
 * @param pageSize - 每页大小
 * @param page - 页码
 * @returns
 */
export const getConversations = async (
  pageSize: number = 20,
  page: number = 1
) => {
  const conversations = await Conversation.find({})
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
  return conversations;
};

/**
 * 获取分页的会话列表
 * @param pageSize - 每页大小
 * @param page - 页码
 * @returns
 */
export const getConversationsWithPagination = async (
  pageSize: number = 20,
  page: number = 1
) => {
  const conversations = await getConversations(pageSize, page);
  const totalCount = await Conversation.countDocuments({});

  return {
    conversations,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

/**
 * 获取会话详情
 * @param conversationId  - 会话ID
 * @param populateMessages - 是否填充消息
 * @param msgLimit        - 消息分页条数；传入时只返回最新 N 条并附带 hasMoreMessages 标志
 * @returns
 */
export const getConversation = async (
  conversationId: string,
  populateMessages: boolean = false,
  msgLimit?: number
) => {
  const conversation = await Conversation.findOne({ conversationId }).lean();
  if (!conversation) {
    throw new NotFoundError(`会话不存在`);
  }
  if (!populateMessages) {
    return conversation;
  }
  if (msgLimit && msgLimit > 0) {
    const { messages, hasMore } = await getMessagesPaginated(conversationId, { limit: msgLimit });
    return { ...conversation, messages, hasMoreMessages: hasMore };
  }
  const messages = await getMessagesByConversationId(conversationId);
  return { ...conversation, messages, hasMoreMessages: false };
};

/**
 * 更新会话标题
 * @param conversationId - 会话ID
 * @param title - 新标题
 * @returns
 */
export const updateConversationTitle = async (
  conversationId: string,
  title: string
) => {
  const conversation = await Conversation.findOneAndUpdate(
    { conversationId },
    { title, titleReady: true },
    { new: true }
  ).lean();
  if (!conversation) {
    throw new NotFoundError(`会话不存在`);
  }
  return conversation;
};

/**
 * 删除会话
 * @param conversationId - 会话ID
 * @return
 */
export const deleteConversation = async (conversationId: string) => {
  // 删除会话
  const result = await Conversation.deleteOne({ conversationId });
  if (result.deletedCount === 0) {
    throw new NotFoundError(`会话不存在`);
  }
  // 删除相关消息
  await Message.deleteMany({ conversationId });
  return true;
};

/**
 * 更新会话时间戳
 * @param conversationId - 会话ID
 */
export const updateConversationTimestamp = async (conversationId: string) => {
  // 什么都不改变，只是更新mongodb的updatedAt字段
  await Conversation.updateOne(
    { conversationId },
    { $currentDate: { updatedAt: true } }
  );
};

export const setConversationInProgress = async (
  conversationId: string,
  inProgress: boolean
) => {
  const result = await Conversation.updateOne(
    { conversationId },
    { inProgress }
  );
  if (result?.matchedCount === 0) {
    throw new NotFoundError(`会话不存在`);
  }
  return true;
};
