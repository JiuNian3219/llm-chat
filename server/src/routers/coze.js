import express from "express";
import {
  cancelChatHandler,
  cancelFileUploadHandler,
  nonStreamChatHandler,
  streamChatHandler,
  uploadFileHandler,
} from "../controllers/coze.js";
import multer from "multer";
import { UPLOAD_LIMITS } from "../services/utils/constants.js";
import { respondWithError } from "../utils/responseFormatter.js";


const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
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
  }
})

router.post("/chat/stream", streamChatHandler);

router.post("/chat/nonStream", nonStreamChatHandler);

router.post("/chat/cancel", cancelChatHandler);

router.post("/upload", upload.single("file"), uploadFileHandler);

router.post("/cancelUpload", cancelFileUploadHandler);

// 上传文件错误处理

router.use((error, req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      respondWithError(res, "文件大小超出限制", 400);
      return;
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      respondWithError(res, "上传文件数量超出限制", 400);
      return;
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      respondWithError(res, "文件上传失败，请检查上传文件", 400);
      return;
    }
  }
  if (error) {
    respondWithError(res, error.message || "文件上传失败", 500);
    return;
  }
})

export default router;
