import {
  cancelChat,
  nonStreamChat,
  streamChat,
} from "../services/coze/chat.js";
import { cancelFileUpload, uploadFile } from "../services/coze/upload.js";
import {
  respondWithError,
  respondWithSuccess,
} from "../utils/responseFormatter.js";

/**
 * 处理非流式聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function nonStreamChatHandler(req, res) {
  const { content, contentType, conversationId,  botId } = req.body;
  const result = await nonStreamChat(content, contentType, conversationId, botId);
  respondWithSuccess(res, result);
}

/**
 * 处理流式聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function streamChatHandler(req, res) {
  // 设置响应头
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { content, contentType, conversationId, botId } = req.body;

  if (!content) {
    res.write(
      `data: ${JSON.stringify({ type: "error", error: "提问内容不能为空" })}\n\n`
    );
    res.end();
    return;
  }

  await streamChat(
    content,
    contentType || "text",
    {
      onStart: (data) => {
        res.write(
          `data: ${JSON.stringify({ type: "start", conversationId: data.conversation_id, chatId: data.id })}\n\n`
        );
      },
      onMessage: (data) => {
        let reasoningContent = data.reasoning_content;
        if (reasoningContent) {
          res.write(
            `data: ${JSON.stringify({ type: "reasoning", content: reasoningContent })}\n\n`
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ type: "message", content: data.content })}\n\n`
          );
        }
      },
      onCompleted: (data) => {
        const { role, type } = data;
        if (role === "assistant" && type === "follow_up") {
          res.write(
            `data: ${JSON.stringify({ type: "follow_up", content: data.content })}\n\n`
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ type: "completed", content: data.content })}\n\n`
          );
        }
      },
      onDone: (data) => {
        res.write(
          `data: ${JSON.stringify({ type: "done", content: data.content })}\n\n`
        );
      },
      onError: (error) => {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: error.msg })}\n\n`
        );
      },
    },
    conversationId,
    botId
  );
  res.end();
}

/**
 * 处理取消聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function cancelChatHandler(req, res) {
  const { chatId, conversationId } = req.body;
  if (!chatId || !conversationId) {
    respondWithError(res, "缺少参数");
    return;
  }
  const result = await cancelChat(chatId, conversationId);
  if (result.status === "canceled") {
    respondWithSuccess(res, result);
  } else {
    respondWithError(res, result?.last_error?.msg || "取消失败，请稍后再试");
  }
}

/**
 * 处理上传文件请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function uploadFileHandler(req, res) {
  const { file } = req;
  // 检查是否有文件上传
  if (!file) {
    respondWithError(res, "没有上传的文件", 400);
    return;
  }
  const fileInfo = {
    filename: file.filename,
    originalname: file.originalname,
    size: file.size,
    path: file.filename,
  }
  try {
    const fileObj = await uploadFile(fileInfo);
    respondWithSuccess(res, fileObj);
  } catch (error) {
    respondWithError(res, error.message || "文件上传失败", 500);
  }
}

/**
 * 处理取消文件上传请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function cancelFileUploadHandler(req, res) {
  const { fileId, filename } = req.body;
  if (!fileId || !filename) {
    respondWithError(res, "缺少文件ID", 400);
    return;
  }
  const result = await cancelFileUpload(fileId, filename);
  if (result.status === "canceled") {
    respondWithSuccess(res, result);
  } else {
    respondWithError(res, result?.message || "取消文件上传失败，请稍后再试", 500);
  }
}