import server from "@/domain/chat/services";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { useMessages } from "@/domain/chat/stores/messageStore";
import {
  formatServerMessages,
  generateMultimodalMessage,
  isImageType,
} from "@/domain/chat/utils";
import type { ChatFile } from "@/src/types/chat";
import type { ChatMessage } from "@/src/types/message";
import type { ContentType } from "@/src/types/services";
import { message as antdMessage } from "antd";

/**
 * 轮询获取会话标题，直到获取到非默认标题或达到最大尝试次数
 * @param conversationId - 会话ID
 * @param params - 可选参数
 * @param params.intervalMs - 轮询间隔（毫秒）
 * @param params.maxAttempts - 最大尝试次数
 * @returns 取消轮询函数
 */
function pollConversationTitle(
  conversationId: string,
  {
    intervalMs = 800,
    maxAttempts = 25,
  }: { intervalMs?: number; maxAttempts?: number } = {}
) {
  let attempts = 0;
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const currentId = useConversation.getState().currentConversationId;
    if (currentId && currentId !== conversationId) return;
    attempts += 1;
    try {
      const { data } = await server.getConversationTitle(conversationId);
      if (data?.titleReady) {
        const title = (data?.title || "").trim();
        useConversation
          .getState()
          .updateConversationTitle(conversationId, title || "新对话");
        return;
      }
    } catch (_error) {
      void 0;
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

/**
 * 加载某会话的消息列表
 * @param conversationId - 会话ID
 */
export async function loadConversationMessages(conversationId: string | null) {
  const chatStore = useChatStore.getState();
  if (chatStore.isFirst) return;
  // 重置消息与流程标志（不清空文件）
  useMessages.getState().reset();
  useChatStore.getState().setIsLoadingMessages(true);
  try {
    if (!conversationId) return;
    const response = await server.getConversationDetail(conversationId);
    const { conversation } = response.data || {};
    const serverMessages = conversation?.messages || [];
    useMessages.getState().setFromServer(formatServerMessages(serverMessages));

    if (conversation?.inProgress) {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        followUps: [],
        isLoading: true,
        isTextCompleted: false,
        isCancel: false,
        chatId: null,
        conversationId,
      };
      useMessages.getState().append(aiMessage);
      useChatStore.getState().setIsChatCompleted(false);

      const cancelFn = server.subscribeChatByConversation(conversationId, {
        onStart: (_data: any) => {
          void 0;
        },
        onMessage: (data: any) => {
          const chatState = useChatStore.getState();
          if (data.chatId && data.chatId !== chatState.currentChatId) {
            useChatStore.getState().setCurrentChatId(data.chatId);
            useMessages.getState().setChatId(aiMessage.id, data.chatId);
          }
          const delta = data?.content || "";
          if (delta) {
            useMessages.getState().appendContent(aiMessage.id, delta);
          }
        },
        onCompleted: (_data: any) => {
          useMessages.getState().patch(aiMessage.id, {
            isLoading: false,
            isTextCompleted: true,
          });
        },
        onFollowUp: (data: any) => {
          if (data?.content) {
            useMessages.getState().addFollowUp(aiMessage.id, data.content);
          }
        },
        onDone: (_data: any) => {
          setTimeout(() => {
            useChatStore.getState().setIsChatCompleted(true);
            useChatStore.getState().setCurrentChatId(null);
          }, 1000);
          useMessages.getState().setLoading(aiMessage.id, false);
          useChatStore.getState().clearCancelStreamRef();
          const {
            currentConversationId,
            refreshConversations,
            fetchCurrentTitle,
          } = useConversation.getState();
          refreshConversations?.();
          fetchCurrentTitle?.(currentConversationId!);
        },
        onError: (error: any) => {
          useChatStore.getState().clearCancelStreamRef();
          useChatStore.getState().setIsChatCompleted(true);
          useChatStore.getState().setCurrentChatId(null);
          const msg = error?.error || error?.msg || error?.message || "";
          const errorText = msg || "AI对话发生错误，请稍后再试";
          useMessages.getState().markError(aiMessage.id, errorText);
          antdMessage.error(errorText);
        },
      });
      useChatStore.getState().setCancelStreamRef(cancelFn || null);
    }
  } catch (error: any) {
    const msg = error?.message || "";
    useMessages.getState().reset();
    if (/会话不存在/.test(msg)) {
      throw error;
    } else {
      console.error("获取会话消息失败:", error);
      antdMessage.error("获取会话消息失败，请稍后再试");
    }
  } finally {
    useChatStore.getState().setIsLoadingMessages(false);
  }
}

/**
 * 发送流式消息
 * @param params - 发送参数
 * @param params.message - 用户消息内容
 * @param params.attachments - 可选的文件附件
 * @param params.callbacks - 可选的回调函数
 * @param params.callbacks.onStart - 开始回调
 * @param params.callbacks.onMessage - 消息回调
 * @param params.callbacks.onCompleted - 完成回调
 * @param params.callbacks.onFollowUp - 后续回调
 * @param params.callbacks.onDone - 结束回调
 * @param params.callbacks.onError - 错误回调
 * @param params.conversationId - 可选的会话ID
 */
export async function sendStreamMessage({
  message,
  attachments,
  callbacks,
  conversationId,
}: {
  message: string;
  attachments?: ChatFile[];
  callbacks?: any;
  conversationId?: string;
}) {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) return;
  // 并发拦截：同一会话在进行中时前置校验，不追加本地消息
  {
    const currentId =
      conversationId || useConversation.getState().currentConversationId;
    if (currentId) {
      await server
        .getConversationDetail(currentId)
        .then(({ data }) => {
          const inProgress = !!data?.conversation?.inProgress;
          if (inProgress) {
            antdMessage.warning("该会话正在生成中，请稍后再试");
            throw new Error("BLOCK_SEND");
          }
        })
        .catch((e) => {
          if (String(e?.message || "") === "BLOCK_SEND") {
            throw e;
          }
        });
    }
  }
  const files = attachments || useChatStore.getState().files || [];

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: trimmedMessage,
    conversationId,
    chatId: null,
    files: files as any,
  };
  useMessages.getState().append(userMessage);

  const aiMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    followUps: [],
    isLoading: true,
    isTextCompleted: false,
    isCancel: false,
    chatId: null,
  };
  useMessages.getState().append(aiMessage);

  const contentType: ContentType = files.length > 0 ? "object_string" : "text";
  const payload =
    contentType === "object_string"
      ? generateMultimodalMessage(trimmedMessage, files)
      : trimmedMessage;

  const { onStart, onMessage, onCompleted, onFollowUp, onDone, onError } =
    callbacks || {};

  useChatStore.getState().setIsChatCompleted(false);

  // 无附件则清空文件队列
  if (!attachments) {
    useChatStore.getState().setFiles([]);
  }

  try {
    // 记录取消函数
    const currentConversationId =
      useConversation.getState().currentConversationId;
    const cancelFn = server.streamChatByCoze(
      payload,
      contentType,
      {
        onStart: (data) => {
          useConversation
            .getState()
            .addNewConversation(data.conversationId, "新对话");
          pollConversationTitle(data.conversationId);
          onStart?.(data);
        },
        onMessage: (data) => {
          const chatState = useChatStore.getState();
          if (data.chatId !== chatState.currentChatId) {
            useChatStore.getState().setCurrentChatId(data.chatId);
            useMessages.getState().setChatId(aiMessage.id, data.chatId);
          }
          useMessages.getState().appendContent(aiMessage.id, data.content);
          onMessage?.(data);
        },
        onCompleted: (data) => {
          useMessages.getState().patch(aiMessage.id, {
            isLoading: false,
            isTextCompleted: true,
          });
          onCompleted?.(data);
        },
        onFollowUp: (data) => {
          useMessages.getState().addFollowUp(aiMessage.id, data.content);
          onFollowUp?.(data);
        },
        onDone: (data) => {
          setTimeout(() => {
            useChatStore.getState().setIsChatCompleted(true);
            useChatStore.getState().setCurrentChatId(null);
          }, 1000);
          useMessages.getState().setLoading(aiMessage.id, false);
          useChatStore.getState().clearCancelStreamRef();
          useChatStore.getState().setIsFirst(false);
          // 完成后刷新会话列表与标题
          const {
            currentConversationId,
            refreshConversations,
            fetchCurrentTitle,
          } = useConversation.getState();
          refreshConversations?.();
          fetchCurrentTitle?.(currentConversationId!);
          onDone?.(data);
        },
        onError: (error) => {
          useChatStore.getState().clearCancelStreamRef();
          useChatStore.getState().setIsChatCompleted(true);
          useChatStore.getState().setCurrentChatId(null);
          useChatStore.getState().setIsFirst(false);
          const msg = error?.error || error?.msg || error?.message || "";
          const isCanceled =
            typeof msg === "string" && /对话已取消/.test(msg);
          if (isCanceled) {
            useMessages.getState().setLoading(aiMessage.id, false);
            useMessages.getState().markCancel(aiMessage.id);
            onError?.(error);
            return;
          }
          const errorText = msg || "AI对话发生错误，请稍后再试";
          useMessages.getState().markError(aiMessage.id, errorText);
          antdMessage.error(errorText);
          onError?.(error);
        },
      },
      currentConversationId || undefined
    );
    useChatStore.getState().setCancelStreamRef(cancelFn || null);
  } catch (error: any) {
    useChatStore.getState().clearCancelStreamRef();
    useChatStore.getState().setIsChatCompleted(true);
    useChatStore.getState().setCurrentChatId(null);
    useChatStore.getState().setIsFirst(false);
    const errorText = error?.message || "AI对话发生错误，请稍后再试";
    useMessages.getState().markError(aiMessage.id, errorText);
    antdMessage.error(errorText);
  }
}

/**
 * 取消当前流式对话
 */
export async function cancelCurrentStream() {
  const chatState = useChatStore.getState();
  const { cancelStreamRef, currentChatId } = chatState;
  const currentConversationId =
    useConversation.getState().currentConversationId;
  const isChatCompleted = chatState.isChatCompleted;
  if (
    !cancelStreamRef ||
    !currentChatId ||
    !currentConversationId ||
    isChatCompleted
  )
    return;

  const response = await server.cancelChatByCoze(
    currentConversationId,
    currentChatId
  );
  const { status } = response.data || {};
  if (status === "canceled") {
    const ids = useMessages.getState().messageIds;
    const byId = useMessages.getState().messagesById;
    const target = ids
      .map((id) => byId[id])
      .find((m) => m.chatId === currentChatId);
    if (target) {
      useMessages.getState().setLoading(target.id, false);
      useMessages.getState().markCancel(target.id);
    }
    useChatStore.getState().setIsChatCompleted(true);
    useChatStore.getState().setCurrentChatId(null);
    cancelStreamRef?.();
    useChatStore.getState().clearCancelStreamRef();
    antdMessage.success("对话已取消");
  } else {
    antdMessage.error("取消对话失败，请稍后再试");
  }
}

/**
 * 上传文件列表
 * @param files - 文件列表
 */
export function uploadFiles(files: File[]) {
  if (!files || files.length === 0) return;
  // 构造本地 uploading 文件项
  const newFiles: ChatFile[] = files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: isImageType(file.type) ? "image" : "file",
    status: "uploading",
    file,
  }));
  useChatStore.getState().addFiles(newFiles);

  // 并发上传
  const currentConversationId =
    useConversation.getState().currentConversationId;
  newFiles.forEach(({ id, name, file }) => {
    server
      .uploadFileByCoze(file as File, currentConversationId as string)
      .then((response) => {
        const { id: newId, url } = response.data || {};
        useChatStore
          .getState()
          .updateFile(id, { id: newId, status: "done", url });
        antdMessage.success(`文件上传成功: ${name}`);
      })
      .catch((error) => {
        useChatStore.getState().removeFile(id);
        antdMessage.error(
          `文件上传失败: ${name}，${error.message || "请稍后再试"}`
        );
      });
  });
}

/**
 * 取消文件上传
 * @param fileId - 文件ID
 * @param filename - 文件名
 */
export function cancelFileUpload(fileId: string, filename: string) {
  if (!fileId || !filename) return;
  useChatStore.getState().updateFile(fileId, { status: "canceling" });
  server
    .cancelFileUploadByCoze(fileId, filename)
    .then((result) => {
      const { status } = result.data || {};
      if (status === "canceled") {
        useChatStore.getState().removeFile(fileId);
      } else {
        throw new Error("取消文件上传失败");
      }
    })
    .catch(() => {
      // 取消失败，恢复为 done
      useChatStore.getState().updateFile(fileId, { status: "done" });
      antdMessage.error(`取消文件上传失败: ${filename}`);
    });
}

/**
 * 标记是否为第一次发送消息（影响是否加载历史消息）
 * @param isFirst - 是否为第一次发送消息
 */
export function handleFirstChange(isFirst: boolean) {
  useChatStore.getState().setIsFirst(!!isFirst);
}

/**
 * 重置聊天流程（不清除文件）
 */
export function resetChatFlow() {
  useMessages.getState().reset();
  useChatStore.getState().resetFlowFlags();
}
