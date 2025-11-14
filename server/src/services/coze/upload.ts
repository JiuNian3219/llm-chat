import { createReadStream } from "fs";
import { join } from "path";
import { FileUploadError } from "../../utils/error.js";
import { getUploadsDir, isImageFile } from "../../utils/file.js";
import { createFileRecord, deleteFileRecord } from "../database/file.js";
import { client } from "./client.js";

/**
 * 上传文件到 Coze
 * @param file - 文件对象
 * @param conversationId - 会话ID
 * @returns
 */
export const uploadFile = async (
  file: Express.Multer.File,
  conversationId: string
) => {
  if (!file) {
    throw new FileUploadError();
  }
  if (!conversationId) {
    throw new FileUploadError("会话ID不能为空");
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
    isImage: isImageFile(file.mimetype),
    url: `/files/${file.filename}`,
    conversationId,
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
 * @param fileId - 文件ID
 * @returns
 */
export const cancelFileUpload = async (fileId: string) => {
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
