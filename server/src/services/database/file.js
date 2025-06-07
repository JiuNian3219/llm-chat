import File from "../../models/file.js";
import { NotFoundError } from "../../utils/error.js";
import { deleteFile, deleteFiles } from "../../utils/file.js";
import { FILE_SAVE_TIME } from "../utils/constants.js";

/**
 * 创建文件记录
 * @param {Object} fileData - 文件数据
 * @param {string} fileData.fileId - 文件ID
 * @param {string} fileData.originalname - 原始文件名
 * @param {string} fileData.filename - 存储的文件名
 * @param {string} fileData.mimetype - 文件的MIME类型
 * @param {number} fileData.size - 文件大小（字节）
 * @param {boolean} fileData.isImage - 是否为图片文件
 * @param {string} [fileData.conversationId] - 关联的会话ID
 * @param {string} [fileData.url] - 文件的访问URL
 */
export const createFileRecord = async ({
  fileId,
  originalname,
  filename,
  mimetype,
  size,
  isImage,
  url = "",
}) => {
  const file = new File({
    fileId,
    originalname,
    filename,
    mimetype,
    size,
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
 * 删除过期的文件记录
 */
export const deleteExpiredFiles = async () => {
  const files = await File.find({
    createdAt: { $lt: new Date(Date.now() - FILE_SAVE_TIME) },
    isDeleted: false,
  }).lean();

  if (files.length === 0) {
    console.log("没有过期的文件需要删除");
    return;
  }

  const fileIds = files.map((file) => file.fileId);
  console.log(`找到 ${files.length} 个过期文件，开始删除...`);
  await File.updateMany(
    { fileId: { $in: fileIds } },
    { isDeleted: true }
  );

  const { success, failed } = await deleteFiles(files.map((file) => file.filename));
  if (success.length > 0) {
    console.log(`成功删除 ${success.length} 个文件`);
  }
  if (failed.length > 0) {
    console.error(`删除文件失败: ${failed.join(", ")}`);
  }
}