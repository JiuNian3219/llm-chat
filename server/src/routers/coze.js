import express from "express";
import {
  cancelChatHandler,
  cancelFileUploadHandler,
  nonStreamChatHandler,
  streamChatHandler,
  uploadFileHandler,
} from "../controllers/coze.js";
import { uploadMiddleware } from "../middleware/upload.js";


const router = express.Router();

router.post("/chat/stream", streamChatHandler);

router.post("/chat/nonStream", nonStreamChatHandler);

router.post("/chat/cancel", cancelChatHandler);

router.post("/upload", uploadMiddleware, uploadFileHandler);

router.post("/cancelUpload", cancelFileUploadHandler);

export default router;
