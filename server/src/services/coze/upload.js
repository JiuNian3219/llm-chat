import { createReadStream } from "fs";
import { join } from "path";
import { FileUploadError } from "../../utils/error.js";
import { getUploadsDir, isImageFile } from "../../utils/file.js";
import { createFileRecord, deleteFileRecord } from "../database/file.js";
import { client } from "./client.js";

/**
 * 上传文件到 Coze
 * @param {Express.Multer.File} file - 文件对象
 * @param {string} conversationId - 会话ID
 * @returns
 */
export const uploadFile = async (file, conversationId) => {
  if (!file || !conversationId) {
    throw new FileUploadError();
  }
  const filePath = join(getUploadsDir(), file.filename);
  const fileBuffer = await createReadStream(filePath);
  const fileObj = await client.files.upload({ file: fileBuffer });

  createFileRecord({
    fileId: fileObj.id,
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    conversationId: conversationId,
    isImage: isImageFile(file.mimetype),
    url: `/files/${file.filename}`,
  });

  return {
    id: fileObj.id,
    originalname: file.originalname,
    size: file.size,
    url: `/files/${file.filename}`,
  };
};

/**
 * 取消文件上传
 * @param {string} fileId - 文件ID
 * @returns
 */
export const cancelFileUpload = async (fileId) => {
  try {
    await deleteFileRecord(fileId).catch((error) => {
      if (error.message !== "文件不存在") {
        throw error;
      }
    });
    return { status: "canceled" };
  } catch (error) {
    console.error("取消文件上传失败:", error);
    return { status: "error", message: "文件上传失败" };
  }
};
