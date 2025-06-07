import Message from "../../models/message.js";

/**
 * 创建消息记录
 * @param {Object} messageData - 消息数据
 * @param {string} messageData.conversationId - 关联的会话ID
 * @param {string} messageData.role - 消息角色, "user" 或 "assistant"
 * @param {string} messageData.content - 消息内容
 * @param {import("@coze/api").ContentType} messageData.contentType - 内容类型, "text", "object_string"
 * @param {string[]} [messageData.followUps] - 后续问题
 * @param {Array} [messageData.files] - 关联的文件列表
 * @param {string} [messageData.chatId] - COZE返回的聊天ID
 */
export const createMessage = async ({
  conversationId,
  role,
  content,
  contentType,
  followUps,
  files,
  chatId,
}) => {
  const message = new Message({
    conversationId,
    role,
    content,
    contentType: contentType || "text",
    followUps: followUps,
    files: files,
    chatId,
  });
  await message.save();
  return message;
};

/**
 * 获取同会话下的所有消息
 * @param {string} conversationId - 会话ID
 */
export const getMessagesByConversationId = async (conversationId) => {
  // 获取同一会话下的所有消息，并按创建时间排序，旧的在前，新的在后
  const messages = await Message.find({ conversationId })
    .populate("files")
    .sort({ createdAt: 1 })
    .lean();
  return messages;
};

/**
 * 删除消息记录
 * @param {string} messageId - 消息ID
 */
export const deleteMessage = async (messageId) => {
  const message = await Message.findOneAndDelete({ messageId });
  if (!message) {
    throw new Error(`消息记录不存在`);
  }
};
