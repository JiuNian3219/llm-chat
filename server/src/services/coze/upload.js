import { createReadStream, rename, unlink } from "fs";
import { client } from "./client.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * @typedef {Object} File
 * @property {string} filename - 文件名
 * @property {string} originalname - 原始文件名
 * @property {number} size - 文件大小
 * @property {string} path - 文件路径
 */

/**
 * 上传文件到 Coze
 * @param {File} file - 文件对象
 * @returns
 */
export const uploadFile = async (file) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = join(__dirname, "../../../uploads", file.filename);
  const fileBuffer = await createReadStream(filePath);
  const fileObj = await client.files.upload({ file: fileBuffer });
  // 文件后缀
  const fileExt = file.filename.split('.').pop();
  const newPath = join(
    __dirname,
    "../../../uploads",
    fileObj.id + "." + fileExt
  );

  // 重命名文件
  await new Promise((resolve, reject) => {
    rename(filePath, newPath, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  return {
    id: fileObj.id,
    originalname: file.originalname,
    size: file.size,
    url: `/files/${fileObj.id}.${fileExt}`,
  };
};

/**
 * 取消文件上传
 * @param {string} fileId - 文件ID
 * @param {string} filename - 文件路径
 * @returns
 */
export const cancelFileUpload = async (fileId, filename) => {
  // 在 uploads 目录中删除文件
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const fileExt = filename.split('.').pop();
  const filePath = join(__dirname, "../../../uploads", fileId + "." + fileExt);
  try {
    await new Promise((resolve, reject) => {
      unlink(filePath, (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            // 文件不存在，直接返回成功
            return resolve();
          }
          reject(err);
        } else resolve();
      });
    });
    return { status: "canceled" };
  } catch (error) {
    return { status: "error", message: error.message };
  }
};
