import express from "express";
import {
    cancelChatHandler,
    cancelFileUploadHandler,
    getConversationHandler,
    getConversationsHandler,
    getConversationsWithPaginationHandler,
    getConversationTitleHandler,
    updateConversationTitleHandler,
    deleteConversationHandler,
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

router.get("/conversation/list", getConversationsWithPaginationHandler);

router.get("/conversation/all", getConversationsHandler);

router.get("/conversation/:id", getConversationHandler);

router.get("/conversation/:id/title", getConversationTitleHandler);

router.put("/conversation/:id/title", updateConversationTitleHandler);

router.delete("/conversation/:id", deleteConversationHandler);


export default router;
