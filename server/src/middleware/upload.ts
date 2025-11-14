import type { RequestHandler } from "express";
import multer from "multer";
import { UPLOAD_LIMITS } from "../services/utils/constants.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // 生成唯一的文件名，避免文件覆盖
    const uniqueSuffix = crypto.randomUUID();
    // 处理文件名编码问题，确保文件名为UTF-8编码
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf-8"
    );
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.fileSize, // 单个文件大小限制
  },
  fileFilter: (req, file, cb) => {
    if (UPLOAD_LIMITS.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的文件类型"));
    }
  },
});

export const uploadMiddleware: RequestHandler = upload.single("file");
