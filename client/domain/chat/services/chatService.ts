import { randomUUID } from "@/base/utils";
import server from "@/domain/chat/services";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { useFileStore } from "@/domain/chat/stores/fileStore";
import {
  formatServerMessages,
  generateMultimodalMessage,
} from "@/domain/chat/utils";
import type { ChatFile } from "@/src/types/chat";
import { MessageStatus, type ChatMessage } from "@/src/types/message";
import type { SSEErrorData, StreamChatCallbacks } from "@/src/types/services";
import type { ContentType } from "@/src/types/services";
import { ChatStatus } from "@/src/types/store";
import { message as antdMessage } from "antd";
import { PlayEngine, type PlayEngineHandlers } from "./PlayEngine";

// ─── Store 快捷引用 ───────────────────────────────────────────────────────────
const chatStore = () => useChatStore.getState();
const convStore = () => useConversation.getState();
const fileStore = () => useFileStore.getState();

// ─── PlayEngine 工厂 ──────────────────────────────────────────────────────────

/**
 * 为指定消息 ID 创建 PlayEngineHandlers，所有 Store 写入集中在此处。
 * PlayEngine 自身不再持有任何 Store 引用。
 */
function createHandlers(messageId: string): PlayEngineHandlers {
  return {
    onContentDelta: (delta) => chatStore().appendContent(messageId, delta),
    onReasoningDelta: (delta) => chatStore().appendReasoning(messageId, delta),
    onSnapshot: (content) => chatStore().setContent(messageId, content),
    onMessageStatus: (status) =>
      chatStore().setMessageStatus(messageId, status),
    getMessageStatus: () =>
      chatStore().messagesById[messageId]?.status ?? MessageStatus.Pending,
    onChatId: (chatId) => chatStore().setChatId(messageId, chatId),
    onFollowUp: (item) => chatStore().addFollowUp(messageId, item),
    onChatStatus: (status) => chatStore().setStatus(status),
    onError: (msg) => chatStore().setContent(messageId, msg),
  };
}

// ─── SSE 会话清理 ─────────────────────────────────────────────────────────────

/**
 * 断开当前 SSE 连接并清除 Store 中的所有 SSE 会话状态。
 * 只断连接，不通知后端——后端继续生成并落库，前端重进时会重新加载。
 */
export function clearSSE() {
  const { cancelSSE } = chatStore();
  cancelSSE?.();
  chatStore().setCancelSSE(null);
  chatStore().setCurrentChatId(null);
  chatStore().setStatus(ChatStatus.Idle);
}

// ─── 流结束后的跨域协调 ───────────────────────────────────────────────────────

/**
 * SSE 正常结束后的后置操作：按需更新标题栏。
 *
 * @param finishedConversationId - 刚刚完成生成的会话 ID（SSE 会话上下文，非导航状态）
 *
 * 不再全量刷新会话列表（避免骨架屏闪烁）：
 * - 新建会话的列表项已在 onStartExtra 中通过 addNewConversation 插入
 * - 列表项标题由 pollConversationTitle → updateConversationTitle 精准更新
 * - 只需在用户仍查看该会话时刷新顶部标题栏
 */
function afterStreamComplete(finishedConversationId: string | null) {
  const { currentConversationId, fetchCurrentTitle } = convStore();
  if (
    finishedConversationId &&
    finishedConversationId === currentConversationId
  ) {
    fetchCurrentTitle(finishedConversationId);
  }
}

// ─── 标题轮询 ─────────────────────────────────────────────────────────────────

/**
 * 轮询获取会话标题，直到标题就绪或超过最大尝试次数。
 * @returns 停止轮询的函数
 */
function pollConversationTitle(
  conversationId: string,
  {
    intervalMs = 800,
    maxAttempts = 25,
  }: { intervalMs?: number; maxAttempts?: number } = {},
): () => void {
  let attempts = 0;
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    // 注意：不在此处检查 currentConversationId。
    // 此函数更新的是会话列表项的标题（updateConversationTitle），
    // 与用户当前查看哪个会话无关，切换会话后仍应继续轮询直到标题就绪。
    attempts += 1;
    try {
      const { data } = await server.getConversationTitle(conversationId);
      if (data?.titleReady) {
        const title = (data?.title || "").trim();
        convStore().updateConversationTitle(conversationId, title || "新对话");
        return;
      }
    } catch {
      // 标题未就绪时静默忽略，继续轮询
    }
    if (attempts < maxAttempts) {
      setTimeout(tick, intervalMs);
    }
  };

  setTimeout(tick, intervalMs);
  return () => {
    stopped = true;
  };
}

// ─── SSE 回调构建 ─────────────────────────────────────────────────────────────

/**
 * 构建标准 SSE 回调，将服务器事件路由到 PlayEngine。
 * sendStreamMessage / loadConversationMessages 均通过此函数统一接入。
 */
function buildSSECallbacks(
  engine: PlayEngine,
  messageId: string,
  options: {
    /**
     * SSE 会话所属的会话 ID。
     * 已知时直接传入；新建会话时为 null，将在 onStartExtra 中通过后端返回的 ID 补全。
     * 用于 afterStreamComplete / cancel 等需要明确会话上下文的操作。
     */
    sseConversationId?: string | null;
    /** 连接建立后的额外操作（如新建会话、开始标题轮询） */
    onStartExtra?: (conversationId: string) => void;
    /** 外部透传回调（来自组件层） */
    external?: Partial<StreamChatCallbacks>;
  } = {},
): StreamChatCallbacks {
  const { onStartExtra, external = {} } = options;

  // 在 SSE 生命周期内稳定持有"本次会话 ID"，不依赖外部全局状态
  let sseConversationId = options.sseConversationId ?? null;

  return {
    onStart: (data) => {
      // 新建会话时，后端返回的 conversationId 是权威来源
      if (!sseConversationId) {
        sseConversationId = data.conversationId;
      }
      // 断线重连时后端会携带 chatId，立即写入避免按钮短暂转圈
      if (data.chatId) {
        chatStore().setCurrentChatId(data.chatId);
      }
      engine.pushEvent(data);
      onStartExtra?.(data.conversationId);
      external.onStart?.(data);
    },
    onSnapshot: (data) => {
      // 断线重连时后端下发全量快照，直接覆盖当前内容以恢复进度
      engine.pushEvent(data);
    },
    onMessage: (data) => {
      // 仅在 chatId 变化时更新，避免无效写入
      const { currentChatId } = chatStore();
      if (data.chatId && data.chatId !== currentChatId) {
        chatStore().setCurrentChatId(data.chatId);
        chatStore().setChatId(messageId, data.chatId);
      }
      engine.pushEvent(data);
      external.onMessage?.(data);
    },
    onReasoning: (data) => {
      engine.pushEvent(data);
    },
    onCompleted: (data) => {
      engine.pushEvent(data);
      external.onCompleted?.(data);
    },
    onFollowUp: (data) => {
      engine.pushEvent(data);
      external.onFollowUp?.(data);
    },
    onDone: (data) => {
      engine.pushEvent(data);
      clearSSE();
      afterStreamComplete(sseConversationId);
      external.onDone?.(data);
    },
    onError: (error: SSEErrorData) => {
      const msg = error.error;
      const isCanceled = typeof msg === "string" && /对话已取消/.test(msg);

      clearSSE();

      if (isCanceled) {
        chatStore().setMessageStatus(messageId, MessageStatus.Canceled);
        chatStore().setStatus(ChatStatus.Idle);
        external.onError?.(error);
        return;
      }

      engine.pushEvent({ type: "error" as const, error: msg });
      antdMessage.error(msg || "AI对话发生错误，请稍后再试");
      external.onError?.(error);
    },
  };
}

/**
 * 加载某会话的历史消息；若后端标记 inProgress 则订阅 SSE 续播
 * @param conversationId - 会话 ID
 */
export async function loadConversationMessages(conversationId: string | null) {
  // 切换会话时主动断开旧 SSE 连接（不通知后端，后端继续生成并落库）
  clearSSE();
  chatStore().resetMessages();
  chatStore().setIsLoadingMessages(true);
  try {
    if (!conversationId) return;
    const response = await server.getConversationDetail(conversationId, { msgLimit: 10 });
    const { conversation } = response.data || {};
    const serverMessages = conversation?.messages || [];
    const formatted = formatServerMessages(serverMessages);
    chatStore().setFromServer(formatted);
    chatStore().setMessagePagination(
      conversation?.hasMoreMessages ?? false,
      formatted[0]?.id ?? null
    );

    if (conversation?.inProgress) {
      const aiMessage: ChatMessage = {
        id: randomUUID(),
        role: "assistant",
        content: "",
        followUps: [],
        status: MessageStatus.Pending,
        chatId: null,
        conversationId,
      };
      chatStore().appendMessage(aiMessage);
      chatStore().setStatus(ChatStatus.Generating);

    const engine = new PlayEngine(aiMessage.id, createHandlers(aiMessage.id));
    const cancelFn = server.subscribeChatByConversation(
        conversationId,
        buildSSECallbacks(engine, aiMessage.id, {
          sseConversationId: conversationId,
        }),
      );
      chatStore().setCancelSSE(cancelFn ?? null);
    }
  } catch (error: any) {
    chatStore().resetMessages();
    const msg = error?.message || "";
    if (/会话不存在/.test(msg)) {
      throw error;
    } else {
      console.error("获取会话消息失败:", error);
      antdMessage.error("获取会话消息失败，请稍后再试");
    }
  } finally {
    chatStore().setIsLoadingMessages(false);
  }
}

/**
 * 发送流式消息
 * 
 * @param message - 消息内容
 * @param attachments - 附件列表
 * @param callbacks - 回调函数
 * @param conversationId - 会话ID
 */
export async function sendStreamMessage({
  message,
  attachments,
  callbacks,
  conversationId,
}: {
  message: string;
  attachments?: ChatFile[];
  callbacks?: Partial<StreamChatCallbacks>;
  conversationId?: string;
}) {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) return;

  // 前置并发拦截：从后端确认当前会话没有正在生成
  const currentId = conversationId || convStore().currentConversationId;
  if (currentId) {
    await server
      .getConversationDetail(currentId)
      .then(({ data }) => {
        if (data?.conversation?.inProgress) {
          antdMessage.warning("该会话正在生成中，请稍后再试");
          throw new Error("BLOCK_SEND");
        }
      })
      .catch((e) => {
        if (String(e?.message || "") === "BLOCK_SEND") throw e;
      });
  }

  const files = attachments || fileStore().files || [];

  const userMessage: ChatMessage = {
    id: randomUUID(),
    role: "user",
    content: trimmedMessage,
    conversationId,
    chatId: null,
    status: MessageStatus.Completed,
    followUps: [],
    files,
  };
  chatStore().appendMessage(userMessage);

  const aiMessage: ChatMessage = {
    id: randomUUID(),
    role: "assistant",
    content: "",
    followUps: [],
    status: MessageStatus.Pending,
    chatId: null,
    conversationId: conversationId || "",
  };
  chatStore().appendMessage(aiMessage);
  chatStore().setStatus(ChatStatus.Generating);

  const contentType: ContentType = files.length > 0 ? "object_string" : "text";
  const payload =
    contentType === "object_string"
      ? generateMultimodalMessage(trimmedMessage, files)
      : trimmedMessage;

  if (!attachments) {
    fileStore().setFiles([]);
  }

  try {
    const activeConversationId =
      conversationId || convStore().currentConversationId;

    const engine = new PlayEngine(aiMessage.id, createHandlers(aiMessage.id));

    // 标题轮询取消句柄，在 SSE 结束/出错时停止
    let stopTitlePoll: (() => void) | undefined;

    const cancelFn = server.streamChatByCoze(
      payload,
      contentType,
      buildSSECallbacks(engine, aiMessage.id, {
        sseConversationId: activeConversationId,
        onStartExtra: (newConversationId) => {
          convStore().addNewConversation(newConversationId, "新对话");
          stopTitlePoll = pollConversationTitle(newConversationId);
        },
        external: {
          ...callbacks,
          onError: (error) => {
            // 出错时停止轮询：制造一个失败的会话不值得继续拉取标题
            stopTitlePoll?.();
            callbacks?.onError?.(error);
          },
        },
      }),
      activeConversationId || undefined,
    );
    chatStore().setCancelSSE(cancelFn ?? null);
  } catch (error: any) {
    clearSSE();
    chatStore().setStatus(ChatStatus.Error);
    const errorText = error?.message || "AI对话发生错误，请稍后再试";
    chatStore().setMessageStatus(aiMessage.id, MessageStatus.Error);
    chatStore().setContent(aiMessage.id, errorText);
    antdMessage.error(errorText);
  }
}

/**
 * 取消当前流式对话
 */
export async function cancelCurrentStream() {
  // 必须在 clearSSE() 之前读取，因为 clearSSE 会清空 currentChatId
  const { currentChatId } = chatStore();
  const conversationId = convStore().currentConversationId;

  // 1. 断开 SSE 连接
  clearSSE();

  // 2. 通知后端停止生成
  if (currentChatId && conversationId) {
    try {
      await server.cancelChatByCoze(conversationId, currentChatId);
    } catch (error) {
      console.error("取消对话失败:", error);
    }
  }

  // 3. 重置流程状态
  chatStore().setStatus(ChatStatus.Idle);
}

/**
 * 向上翻页加载更早的历史消息
 * 使用 oldestMessageId 作为游标，向服务端请求更旧的一批消息，前置插入 Store。
 *
 * @param conversationId - 当前会话 ID
 */
export async function loadMoreMessages(conversationId: string) {
  const { oldestMessageId, isLoadingMoreMessages, hasMoreMessages } = chatStore();
  if (isLoadingMoreMessages || !hasMoreMessages || !oldestMessageId) return;

  chatStore().setIsLoadingMoreMessages(true);
  try {
    const response = await server.getConversationMessages(conversationId, {
      before: oldestMessageId,
      limit: 10,
    });
    const { messages, hasMore } = response.data || {};
    const formatted = formatServerMessages(messages || []);
    chatStore().prependMessages(formatted, hasMore ?? false);
  } catch (error: any) {
    console.error("加载更多消息失败:", error);
    antdMessage.error("加载历史消息失败，请稍后再试");
  } finally {
    chatStore().setIsLoadingMoreMessages(false);
  }
}

/**
 * 重置聊天流程（不清除文件）
 */
export function resetChatFlow() {
  clearSSE();
  chatStore().resetMessages();
  chatStore().setStatus(ChatStatus.Idle);
  chatStore().setIsLoadingMessages(false);
}
