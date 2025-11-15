import type { Request, Response } from "express";
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
  updateConversationTitle,
  deleteConversation,
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
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const nonStreamChatHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { content, contentType, conversationId } = req.body;
    if (!content) {
      throw new ValidationError("内容不能为空");
    }
    const result = await nonStreamChat(content, contentType, conversationId);
    success(res, result);
  }
);

/**
 * 处理流式聊天请求
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const streamChatHandler = asyncHandler(
  async (req: Request, res: Response) => {
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
          onStart: (data: any) => {
            sendSSEMessage(res, {
              type: "start",
              conversationId: data.conversation_id,
            });
          },
          onMessage: (data: any) => {
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
          onCompleted: (data: any) => {
            const { role, type } = data;
            if (role === "assistant" && type === "follow_up") {
              sendSSEMessage(res, { type: "follow_up", content: data.content });
            } else {
              sendSSEMessage(res, { type: "completed", content: data.content });
            }
          },
          onDone: (data: any) => {
            sendSSEMessage(res, { type: "done", content: data.content });
            res.end();
          },
          onError: (error: any) => {
            sendSSEError(res, error.msg || "对话服务暂时不可用");
          },
        },
        conversationId
      );
    } catch (error: any) {
      // 如果响应未开始，则返回JSON格式的错误，开始后使用SSE发送错误
      if (!res.headersSent) {
        throw error;
      } else {
        sendSSEError(res, error.message || "对话服务暂时不可用");
      }
    }
  }
);

/**
 * 处理取消聊天请求
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const cancelChatHandler = asyncHandler(
  async (req: Request, res: Response) => {
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
  }
);

/**
 * 处理上传文件请求
 * @param req - 请求对象
 * @param res - 响应对象
 */
export async function uploadFileHandler(req: Request, res: Response) {
  const { file } = req;
  const { conversationId } = req.body as any;
  // 检查是否有文件上传
  if (!file) {
    error(res, "没有上传的文件", 400);
    return;
  }
  if (!conversationId) {
    error(res, "会话ID不能为空", 400);
    return;
  }
  const fileObj = await uploadFile(file as any, conversationId as string);
  success(res, fileObj);
}

/**
 * 处理取消文件上传请求
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const cancelFileUploadHandler = asyncHandler(
  async (req: Request, res: Response) => {
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
  }
);

/**
 * 获取所有会话列表
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const getConversationsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const conversations = await getAllConversations();
    if (!conversations || conversations.length === 0) {
      success(res, { conversations: [] });
    } else {
      success(res, { conversations });
    }
  }
);

/**
 * 获取会话列表，支持分页
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const getConversationsWithPaginationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { pageSize = 20, page = 1 } = req.query as any;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    // 验证页码和每页大小
    if (
      isNaN(pageNum) ||
      isNaN(pageSizeNum) ||
      pageNum < 1 ||
      pageSizeNum < 1
    ) {
      throw new Error(
        `页码和每页大小异常, page: ${page}, pageSize: ${pageSize}`
      );
    }
    // 每页最大限制为100
    const validPageSize = Math.min(pageSizeNum, 100);
    const result = await getConversationsWithPagination(
      parseInt(pageSize as string, 10),
      parseInt(page as string, 10)
    );
    success(res, {
      ...result,
      page: pageNum,
      pageSize: validPageSize,
    });
  }
);

/**
 * 获取会话标题
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const getConversationTitleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error("会话ID不能为空");
    }
    const conversation = await getConversation(id, false);
    if (!conversation) {
      throw new NotFoundError("会话不存在");
    }
    success(res, {
      title: (conversation as any).title,
      titleReady: !!(conversation as any).titleReady,
    });
  }
);

/**
 * 获取会话详情
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const getConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error("会话ID不能为空");
    }
    const conversation = await getConversation(id, true);
    if (!conversation) {
      throw new NotFoundError("会话不存在");
    }
    success(res, { conversation });
  }
);

/**
 * 更新会话标题
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const updateConversationTitleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title } = req.body as any;
    if (!id) {
      throw new Error("会话ID不能为空");
    }
    const newTitle = (title || "").trim();
    if (!newTitle) {
      throw new ValidationError("标题不能为空");
    }
    const conversation = await updateConversationTitle(id, newTitle);
    success(res, { conversation });
  }
);

/**
 * 删除会话（及其消息）
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const deleteConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error("会话ID不能为空");
    }
    await deleteConversation(id);
    success(res, { ok: true });
  }
);
