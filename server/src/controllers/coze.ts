import type { Request, Response } from "express";
import { channelForConversation, redisSub } from "../config/redis.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import {
  cancelChat,
  createNewConversation,
  nonStreamChat,
  streamChat,
} from "../services/coze/chat.js";
import { cancelFileUpload, uploadFile } from "../services/coze/upload.js";
import {
  deleteConversation,
  getAllConversations,
  getConversation,
  getConversationsWithPagination,
  updateConversationTitle,
} from "../services/database/conversation.js";
import { getMessagesPaginated } from "../services/database/message.js";
import { getSnapshot } from "../services/stream/hub.js";
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
    const { content, contentType } = req.body;
    let { conversationId } = req.body;

    if (!content) {
      throw new ValidationError("内容不能为空");
    }

    // 新会话：先在 Coze 和 MongoDB 中创建会话记录，再订阅正确的 Redis 频道
    // 此步骤在 setupSSE 之前执行，若失败则正常返回 JSON 错误响应
    if (!conversationId) {
      conversationId = await createNewConversation(content);
    }

    setupSSE(res);

    // 先订阅 Redis 频道，再启动生成，避免错过 start 事件
    const channel = channelForConversation(conversationId);
    const sub = redisSub.duplicate();
    await sub.subscribe(channel);

    const onMessage = (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "error") {
          sendSSEError(res, data.error || "对话服务暂时不可用");
          sub.unsubscribe(channel);
          return;
        }
        if (data.type === "done") {
          sendSSEMessage(res, { type: "done" });
          sub.unsubscribe(channel);
          res.end();
          return;
        }
        sendSSEMessage(res, data);
      } catch (e) {
        console.error("消息解析失败:", e);
      }
    };

    sub.on("message", (chan: string, msg: string) => {
      if (chan === channel) onMessage(msg);
    });

    req.on("close", () => {
      try {
        sub.unsubscribe(channel);
        sub.removeAllListeners("message");
        sub.disconnect();
      } catch {}
    });

    // 在后台启动流式生成；streamChat 内部 catch 会通过 publishError → Redis → SSE 通知前端
    // 若 Redis 通道异常导致通知未能到达，此处兜底直接写 SSE
    streamChat(content, contentType || "text", conversationId).catch(
      (err: any) => {
        console.error("流式聊天失败:", err);
        if (!res.writableEnded) {
          sendSSEError(res, err.message || "对话服务暂时不可用");
        }
      }
    );
  }
);

/**
 * 订阅指定会话的流式输出（断线重连 / 刷新后续播）
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const subscribeChatHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.body;
    if (!conversationId) {
      throw new ValidationError("会话ID不能为空");
    }
    setupSSE(res);

    const snapshot = await getSnapshot(conversationId);
    // chatId 随 start 事件下发，前端收到后立即设置 currentChatId，避免按钮短暂转圈
    sendSSEMessage(res, { type: "start", conversationId, chatId: snapshot.chatId });
    if (snapshot.content || snapshot.reasoning) {
      sendSSEMessage(res, {
        type: "snapshot",
        content: snapshot.content,
        reasoning_content: snapshot.reasoning || undefined,
      });
    }
    if (snapshot.status === "completed") {
      sendSSEMessage(res, {
        type: "completed",
        content: snapshot.content || "",
      });
    }
    if (snapshot.status === "done") {
      sendSSEMessage(res, { type: "done", content: snapshot.content || "" });
      return res.end();
    }
    if (snapshot.status === "error") {
      sendSSEError(res, "对话服务暂时不可用");
      return;
    }

    const channel = channelForConversation(conversationId);
    const sub = redisSub.duplicate();
    await sub.subscribe(channel);

    const onMessage = (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "error") {
          sendSSEError(res, data.error || "对话服务暂时不可用");
          sub.unsubscribe(channel);
          return;
        }
        if (data.type === "done") {
          sendSSEMessage(res, {
            type: "done",
            content: snapshot.content || "",
          });
          sub.unsubscribe(channel);
          res.end();
          return;
        }
        sendSSEMessage(res, data);
      } catch (e) {
        console.error("订阅消息解析失败:", e);
      }
    };

    sub.on("message", (chan: string, msg: string) => {
      if (chan === channel) onMessage(msg);
    });

    req.on("close", () => {
      try {
        sub.unsubscribe(channel);
        sub.removeAllListeners("message");
        sub.disconnect();
      } catch {}
    });
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
 * 支持 ?msgLimit=N 按需分页，仅返回最新 N 条消息 + hasMoreMessages 标志
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const getConversationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new Error("会话ID不能为空");
    }
    const { msgLimit } = req.query;
    const limit = msgLimit ? parseInt(msgLimit as string, 10) : undefined;
    const conversation = await getConversation(id, true, limit);
    if (!conversation) {
      throw new NotFoundError("会话不存在");
    }
    success(res, { conversation });
  }
);

/**
 * 按需加载更多历史消息（游标分页）
 * GET /conversation/:id/messages?limit=10&before=<ObjectId>
 * @param req - 请求对象
 * @param res - 响应对象
 */
export const getConversationMessagesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new ValidationError("会话ID不能为空");
    }
    const { limit = "10", before } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 10, 50);
    const { messages, hasMore } = await getMessagesPaginated(id, {
      limit: limitNum,
      before: before as string | undefined,
    });
    success(res, { messages, hasMore });
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
