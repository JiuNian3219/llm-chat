import File from "../../models/file.js";
import { NotFoundError } from "../../utils/error.js";
import { deleteFile, deleteFiles } from "../../utils/file.js";

/**
 * 创建文件记录
 * @param {Object} fileData - 文件数据
 * @param {string} fileData.fileId - 文件ID
 * @param {string} fileData.originalname - 原始文件名
 * @param {string} fileData.filename - 存储的文件名
 * @param {string} fileData.mimetype - 文件的MIME类型
 * @param {number} fileData.size - 文件大小（字节）
 * @param {string} fileData.conversationId - 关联的会话ID
 * @param {boolean} fileData.isImage - 是否为图片文件
 * @param {string} [fileData.url] - 文件的访问URL
 */
export const createFileRecord = async ({
  fileId,
  originalname,
  filename,
  mimetype,
  size,
  conversationId,
  isImage,
  url = "",
}) => {
  const file = new File({
    fileId,
    originalname,
    filename,
    mimetype,
    size,
    conversationId,
    isImage,
    url,
  });
  await file.save();
  return file.toObject();
};

/**
 * 获取文件记录
 * @param {string} fileId - 文件ID
 */
export const getFileRecord = async (fileId) => {
  const file = await File.findOne({ fileId }).lean();
  if (!file) {
    throw new NotFoundError(`文件不存在`);
  }
  return file;
};

/**
 * 通过fileIds获取文件记录
 * @param {string[]} fileIds - 文件ID数组
 */
export const getFilesByIds = async (fileIds) => {
  if (!fileIds || fileIds.length === 0) {
    return [];
  }
  const files = await File.find({ fileId: { $in: fileIds } }).lean();
  return files;
};

/**
 * 删除文件记录
 * @param {string} fileId - 文件ID
 */
export const deleteFileRecord = async (fileId) => {
  const file = await File.findOneAndDelete({ fileId }).lean();
  if (!file) {
    throw new NotFoundError(`文件不存在`);
  }
  // 删除文件系统中的实际文件
  await deleteFile(file.filename);
};

/**
 * 删除同会话下的所有文件记录
 * @param {string} conversationId - 会话ID
 */
export const deleteFilesByConversationId = async (conversationId) => {
  const files = await File.find({ conversationId }).lean();
  if (files.length === 0) {
    return;
  }
  // 删除数据库中的文件记录
  await File.deleteMany({ conversationId });
  // 删除文件系统中的实际文件
  const filenames = files.map((file) => file.filename);
  const { _, failed } = await deleteFiles(filenames);

  if (failed.length > 0) {
    console.warn(`删除会话 ${conversationId} 的文件失败: ${failed.join(", ")}`);
  }
};
