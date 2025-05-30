import Conversation from "../../models/conversation.js";
import Message from "../../models/message.js";
import { NotFoundError } from "../../utils/error.js";
import { deleteFilesByConversationId } from "./file.js";
import { getMessagesByConversationId } from "./message.js";

/**
 * 在数据库中创建一个新的会话
 * @param {string} conversationId
 * @param {string} title
 * @returns
 */
export const createConversation = async (conversationId, title) => {
  const conversation = new Conversation({
    conversationId,
    title: title,
  });
  await conversation.save();
  return conversation.toObject();
};

/**
 * 获取会话列表
 * @param {number} pageSize - 每页大小
 * @param {number} page - 页码
 * @returns
 */
export const getConversations = async (pageSize = 15, page = 1) => {
  const conversations = await Conversation.find({})
    .sort({ updatedAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();
  return conversations;
};

/**
 * 获取分页的会话列表
 * @param {number} pageSize - 每页大小
 * @param {number} page - 页码
 * @returns
 */
export const getConversationsWithPagination = async (pageSize = 15, page = 1) => {
  const conversations = await getConversations(pageSize, page);  
  const totalCount = await Conversation.countDocuments({});
  
  return {
    conversations,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * 获取会话详情
 * @param {string} conversationId - 会话ID
 * @param {boolean} [populateMessages=false] - 是否填充消息
 * @returns
 */
export const getConversation = async (
  conversationId,
  populateMessages = false
) => {
  const conversation = await Conversation.findOne({ conversationId }).lean();
  if (!conversation) {
    throw new NotFoundError(`会话不存在`);
  }
  if (!populateMessages) {
    return conversation;
  }
  const messages = await getMessagesByConversationId(conversationId);
  return {
    ...conversation,
    messages: messages,
  };
};

/**
 * 更新会话标题
 * @param {string} conversationId - 会话ID
 * @param {string} title - 新标题
 * @returns
 */
export const updateConversationTitle = async (conversationId, title) => {
  const conversation = await Conversation.findOneAndUpdate(
    { conversationId },
    { title },
    { new: true }
  ).lean();
  if (!conversation) {
    throw new NotFoundError(`会话不存在`);
  }
  return conversation;
};

/**
 * 删除会话
 * @param {string} conversationId - 会话ID
 * @return
 */
export const deleteConversation = async (conversationId) => {
  // 删除会话
  const result = await Conversation.deleteOne({ conversationId });
  if (result.deletedCount === 0) {
    throw new NotFoundError(`会话不存在`);
  }
  // 删除相关消息
  await Message.deleteMany({ conversationId });
  // 删除相关文件
  await deleteFilesByConversationId(conversationId);
  return true;
};
