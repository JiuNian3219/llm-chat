import { asyncHandler } from "../middleware/errorHandler.js";
import {
  cancelChat,
  nonStreamChat,
  streamChat,
} from "../services/coze/chat.js";
import { cancelFileUpload, uploadFile } from "../services/coze/upload.js";
import {
  getAllConversations,
  getConversation,
  getConversationsWithPagination,
} from "../services/database/conversation.js";
import {
  CustomError,
  FileUploadError,
  NotFoundError,
  ValidationError,
} from "../utils/error.js";
import { error, success } from "../utils/response.js";
import { sendSSEError, sendSSEMessage, setupSSE } from "../utils/sse.js";

/**
 * 处理非流式聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const nonStreamChatHandler = asyncHandler(async (req, res) => {
  const { content, contentType, conversationId } = req.body;
  if (!content) {
    throw new ValidationError("内容不能为空");
  }
  const result = await nonStreamChat(content, contentType, conversationId);
  success(res, result);
});

/**
 * 处理流式聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const streamChatHandler = asyncHandler(async (req, res) => {
  const { content, contentType, conversationId } = req.body;

  if (!content) {
    throw new ValidationError("内容不能为空");
  }

  // 设置响应头
  setupSSE(res);

  try {
    await streamChat(
      content,
      contentType || "text",
      {
        onStart: (data) => {
          sendSSEMessage(res, {
            type: "start",
            conversationId: data.conversation_id,
          });
        },
        onMessage: (data) => {
          let reasoningContent = data.reasoning_content;
          if (reasoningContent) {
            sendSSEMessage(res, {
              type: "reasoning",
              content: reasoningContent,
            });
          } else {
            sendSSEMessage(res, {
              type: "message",
              content: data.content,
              chatId: data.chat_id,
            });
          }
        },
        onCompleted: (data) => {
          const { role, type } = data;
          if (role === "assistant" && type === "follow_up") {
            sendSSEMessage(res, { type: "follow_up", content: data.content });
          } else {
            sendSSEMessage(res, { type: "completed", content: data.content });
          }
        },
        onDone: (data) => {
          sendSSEMessage(res, { type: "done", content: data.content });
          res.end();
        },
        onError: (error) => {
          sendSSEError(res, error.msg || "对话服务暂时不可用");
        },
      },
      conversationId
    );
  } catch (error) {
    // 如果响应未开始，则返回JSON格式的错误，开始后使用SSE发送错误
    if (!res.headersSent) {
      throw error;
    } else {
      sendSSEError(res, error.message || "对话服务暂时不可用");
    }
  }
});

/**
 * 处理取消聊天请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const cancelChatHandler = asyncHandler(async (req, res) => {
  const { chatId, conversationId } = req.body;
  if (!chatId || !conversationId) {
    throw new Error(
      `缺少聊天ID或会话ID, chatId：${chatId}, conversationId：${conversationId}`
    );
  }
  const result = await cancelChat(chatId, conversationId);
  if (result.status === "canceled") {
    success(res, result);
  } else {
    console.error("取消聊天失败:", result?.last_error?.msg || "未知错误");
    throw new CustomError("取消聊天失败，请稍后再试");
  }
});

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
    error(res, "没有上传的文件", 400);
    return;
  }
  const fileObj = await uploadFile(file);
  success(res, fileObj);
}

/**
 * 处理取消文件上传请求
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const cancelFileUploadHandler = asyncHandler(async (req, res) => {
  const { fileId } = req.body;
  if (!fileId) {
    throw new Error("文件ID不能为空");
  }
  const result = await cancelFileUpload(fileId);
  if (result.status === "canceled") {
    success(res, result);
  } else {
    throw new FileUploadError(
      result?.message || "取消文件上传失败，请稍后再试"
    );
  }
});

/**
 * 获取所有会话列表
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getConversationsHandler = asyncHandler(async (req, res) => {
  const conversations = await getAllConversations();
  if (!conversations || conversations.length === 0) {
    success(res, { conversations: [] });
  } else {
    success(res, { conversations });
  }
});

/**
 * 获取会话列表，支持分页
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getConversationsWithPaginationHandler = asyncHandler(async (req, res) => {
  const { pageSize = 20, page = 1 } = req.query;
  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(pageSize, 10);
  // 验证页码和每页大小
  if (isNaN(pageNum) || isNaN(pageSizeNum) || pageNum < 1 || pageSizeNum < 1) {
    throw new Error(`页码和每页大小异常, page: ${page}, pageSize: ${pageSize}`);
  }
  // 每页最大限制为100
  const validPageSize = Math.min(pageSizeNum, 100);
  const result = await getConversationsWithPagination(
    parseInt(pageSize, 10),
    parseInt(page, 10)
  );
  success(res, {
    ...result,
    page: pageNum,
    pageSize: validPageSize,
  });
});

/**
 * 获取会话标题
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getConversationTitleHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new Error("会话ID不能为空");
  }
  const conversation = await getConversation(id, false);
  if (!conversation) {
    throw new NotFoundError("会话不存在");
  }
  success(res, { title: conversation.title, titleReady: !!conversation.titleReady });
});

/**
 * 获取会话详情
 * @type {import('express').RequestHandler}
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getConversationHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new Error("会话ID不能为空");
  }
  const conversation = await getConversation(id, true);
  if (!conversation) {
    throw new NotFoundError("会话不存在");
  }
  success(res, { conversation });
});