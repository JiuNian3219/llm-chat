import { existsSync, mkdirSync } from "fs";
import { rename, unlink } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, "../../uploads");

// 确保上传目录存在
if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * 获取上传目录的绝对路径
 * @returns
 */
export const getUploadsDir = (): string => {
  return UPLOADS_DIR;
};

/**
 * 判断是不是图片文件
 * @param mimetype - 文件的 MIME 类型
 * @returns
 */
export const isImageFile = (mimetype: string): boolean => {
  if (!mimetype || typeof mimetype !== "string") {
    return false;
  }
  return mimetype.startsWith("image/");
};

/**
 * 重命名文件
 * @param oldName - 旧文件名
 * @param newName - 新文件名
 * @returns
 */
export const renameFile = async (
  oldName: string,
  newName: string
): Promise<boolean> => {
  if (
    !oldName ||
    !newName ||
    typeof oldName !== "string" ||
    typeof newName !== "string"
  ) {
    console.warn("重命名文件失败: 无效的文件名:", oldName, newName);
    return false;
  }

  const oldPath = join(getUploadsDir(), oldName);
  const newPath = join(getUploadsDir(), newName);

  try {
    await rename(oldPath, newPath);
    return true;
  } catch (error: any) {
    console.error(`重命名文件失败 ${oldName} -> ${newName}:`, error?.message);
    return false;
  }
};

/**
 * 删除上传目录下指定名字的文件
 * @param filename - 要删除的文件名
 * @returns
 */
export const deleteFile = async (filename: string): Promise<boolean> => {
  if (!filename || typeof filename !== "string") {
    console.warn("删除文件失败: 无效的文件名:", filename);
    return false;
  }

  const filePath = join(getUploadsDir(), filename);

  try {
    await unlink(filePath);
    return true;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // 文件不存在，认为删除成功
      return true;
    }
    console.error(`删除文件失败 ${filename}:`, error?.message);
    return false;
  }
};

/**
 * 批量删除文件
 * @param filenames - 文件名数组
 * @returns
 */
export const deleteFiles = async (
  filenames: string[]
): Promise<{ success: string[]; failed: string[] }> => {
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return { success: [], failed: [] };
  }

  const results = await Promise.allSettled(
    filenames.map(async (filename) => {
      const success = await deleteFile(filename);
      return { filename, success };
    })
  );

  const success: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value.success) {
      success.push(result.value.filename);
    } else {
      failed.push(filenames[index]);
    }
  });

  return { success, failed };
};
