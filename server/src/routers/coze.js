import express from "express";
import { nonStreamChatHandler, streamChatHandler } from "../controllers/coze.js";

const router = express.Router();

router.post("/chat/stream", streamChatHandler);

router.post("/chat/nonStream", nonStreamChatHandler);

export default router;
