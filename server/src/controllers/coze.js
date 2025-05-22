import { cancelChat, nonStreamChat, streamChat } from "../services/coze/chat.js";
import { respondWithError, respondWithSuccess } from "../utils/responseFormatter.js";

/**
 * 处理非流式聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function nonStreamChatHandler(req, res) {
  const { conversationId, content, botId } = req.body;
  const result = await nonStreamChat(content, conversationId, botId);
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

  const { content, conversationId, botId } = req.body;

  if (!content) {
    res.write(
      `data: ${JSON.stringify({ type: "error", error: "提问内容不能为空" })}\n\n`
    );
    res.end();
    return;
  }

  await streamChat(
    content,
    {
      onStart: (data) => {
        res.write(
          `data: ${JSON.stringify({ type: "start", conversationId: data.conversation_id, chatId: data.id })}\n\n`
        );
      },
      onMessage: (data) => {
        res.write(
          `data: ${JSON.stringify({ type: "message", content: data.content })}\n\n`
        );
      },
      onCompleted: (data) => {
        res.write(
          `data: ${JSON.stringify({ type: "completed", messageType: data.type, content: data.content })}\n\n`
        );
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
  console.log('取消聊天请求:', req.body);
  const { chatId, conversationId } = req.body;
  if (!chatId || !conversationId) {
    respondWithError(res, '缺少参数');
    return;
  }
  const result = await cancelChat(chatId, conversationId);
  console.log('取消聊天结果:', result);
  if (result.status === 'canceled') {
    respondWithSuccess(res, result);
  } else {
    respondWithError(res, result?.last_error?.msg || '取消失败，请稍后再试');
  }
}