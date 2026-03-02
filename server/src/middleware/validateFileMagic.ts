import type { RequestHandler } from "express";
import { fileTypeFromFile } from "file-type";
import { join } from "path";
import { unlink } from "fs/promises";
import { getUploadsDir } from "../utils/file.js";
import { UPLOAD_LIMITS } from "../services/utils/constants.js";

/** 无 Magic Bytes 的文本类型（file-type 会返回 undefined） */
const TEXT_ONLY_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/html",
  "text/css",
  "text/javascript",
  "text/x-c",
  "text/x-python",
  "text/x-java",
  "application/json",
  "text/csv",
]);

const ALLOWED_SET = new Set(UPLOAD_LIMITS.allowedTypes);

/** MIME 等价映射（如 image/jpeg 与 image/jpg） */
const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
};

function normalizeMime(mime: string): string {
  return MIME_ALIASES[mime] || mime;
}

/**
 * 校验上传文件的真实类型（Magic Bytes），防止伪装成合法类型的恶意文件
 * 须在 multer 之后使用
 */
export const validateFileMagic: RequestHandler = async (req, res, next) => {
  const file = req.file;
  if (!file) return next();

  const filePath = join(getUploadsDir(), file.filename);

  try {
    const detected = await fileTypeFromFile(filePath);

    if (detected) {
      // 有 Magic Bytes：必须同时满足「在允许列表」且「与声明一致」
      const claimed = normalizeMime(file.mimetype);
      const real = normalizeMime(detected.mime);

      if (!ALLOWED_SET.has(claimed)) {
        await unlink(filePath).catch(() => {});
        return next(new Error("不支持的文件类型"));
      }
      if (claimed !== real) {
        await unlink(filePath).catch(() => {});
        return next(new Error("文件实际类型与声明不符，已拒绝"));
      }
    } else {
      // 无 Magic Bytes（文本类）：仅允许声明的文本类型
      if (!TEXT_ONLY_TYPES.has(file.mimetype)) {
        await unlink(filePath).catch(() => {});
        return next(new Error("无法识别文件类型，已拒绝"));
      }
    }

    next();
  } catch (err) {
    await unlink(filePath).catch(() => {});
    next(err);
  }
};
