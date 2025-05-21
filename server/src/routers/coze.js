import express from "express";
import {
  cancelChatHandler,
  nonStreamChatHandler,
  streamChatHandler,
} from "../controllers/coze.js";

const router = express.Router();

router.post("/chat/stream", streamChatHandler);

router.post("/chat/nonStream", nonStreamChatHandler);

router.post("/chat/cancel", cancelChatHandler);

export default router;
