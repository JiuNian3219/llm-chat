import server from "@/domain/chat/services";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { useMessages } from "@/domain/chat/stores/messageStore";
import { formatServerMessages, generateMultimodalMessage, isImageType } from "@/domain/chat/utils";
import { message as antdMessage } from "antd";

/**
 * 加载某会话的消息列表
 * @param {string|null} conversationId
 */
export async function loadConversationMessages(conversationId) {
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
  } catch (error) {
    console.error("获取会话消息失败:", error);
    antdMessage.error("获取会话消息失败，请稍后再试");
    useMessages.getState().reset();
  } finally {
    useChatStore.getState().setIsLoadingMessages(false);
  }
}

/**
 * 发送流式消息
 * @param {object} params - 发送参数
 * @param {string} params.message - 用户消息内容
 * @param {File[]} [params.attachments] - 可选的文件附件
 * @param {object} [params.callbacks] - 可选的回调函数
 * @param {Function} [params.callbacks.onStart] - 开始回调
 * @param {Function} [params.callbacks.onMessage] - 消息回调
 * @param {Function} [params.callbacks.onCompleted] - 完成回调
 * @param {Function} [params.callbacks.onFollowUp] - 后续回调
 * @param {Function} [params.callbacks.onDone] - 结束回调
 * @param {Function} [params.callbacks.onError] - 错误回调
 * @param {string} [params.conversationId] - 可选的会话ID
 */
export async function sendStreamMessage({ message, attachments, callbacks, conversationId }) {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) return;
  const files = attachments || useChatStore.getState().files || [];

  const userMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: trimmedMessage,
    conversationId,
    files,
  };
  useMessages.getState().append(userMessage);

  const aiMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    followUps: [],
    isLoading: true,
    isCancel: false,
  };
  useMessages.getState().append(aiMessage);

  const contentType = files.length > 0 ? "object_string" : "text";
  const payload = contentType === "object_string" ? generateMultimodalMessage(trimmedMessage, files) : trimmedMessage;

  const { onStart, onMessage, onCompleted, onFollowUp, onDone, onError } = callbacks || {};

  useChatStore.getState().setIsChatCompleted(false);

  // 无附件则清空文件队列
  if (!attachments) {
    useChatStore.getState().setFiles([]);
  }

  try {
    // 记录取消函数
    const currentConversationId = useConversation.getState().currentConversationId;
    const cancelFn = server.streamChatByCoze(payload, contentType, {
      onStart: (data) => {
        useConversation.getState().addNewConversation(data.conversationId, "新对话");
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
        useMessages.getState().setLoading(aiMessage.id, false);
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
        useChatStore.getState().clearCancelStreamRef();
        useChatStore.getState().setIsFirst(false);
        // 完成后刷新会话列表与标题
        const { currentConversationId, refreshConversations, fetchCurrentTitle } = useConversation.getState();
        refreshConversations?.();
        fetchCurrentTitle?.(currentConversationId);
        onDone?.(data);
      },
      onError: (error) => {
        useChatStore.getState().clearCancelStreamRef();
        useChatStore.getState().setIsChatCompleted(true);
        useChatStore.getState().setCurrentChatId(null);
        useChatStore.getState().setIsFirst(false);
        const errorText = error?.error || error?.message || "AI对话发生错误，请稍后再试";
        useMessages.getState().markError(aiMessage.id, errorText);
        antdMessage.error(errorText);
        onError?.(error);
      },
    }, currentConversationId);
    useChatStore.getState().setCancelStreamRef(cancelFn);
  } catch (error) {
    useChatStore.getState().clearCancelStreamRef();
    useChatStore.getState().setIsChatCompleted(true);
    useChatStore.getState().setCurrentChatId(null);
    useChatStore.getState().setIsFirst(false);
    const errorText = error?.message || "AI对话发生错误，请稍后再试";
    useMessages.getState().markError(aiMessage.id, errorText);
    antdMessage.error(errorText);
  }
}

/** 取消当前流式对话 */
export async function cancelCurrentStream() {
  const chatState = useChatStore.getState();
  const { cancelStreamRef, currentChatId } = chatState;
  const currentConversationId = useConversation.getState().currentConversationId;
  const isChatCompleted = chatState.isChatCompleted;
  if (!cancelStreamRef || !currentChatId || !currentConversationId || isChatCompleted) return;

  const response = await server.cancelChatByCoze(currentConversationId, currentChatId);
  const { status } = response.data || {};
  if (status === "canceled") {
    const ids = useMessages.getState().messageIds;
    const byId = useMessages.getState().messagesById;
    const target = ids.map((id) => byId[id]).find((m) => m.chatId === currentChatId);
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

/** 上传文件列表 */
export function uploadFiles(files) {
  if (!files || files.length === 0) return;
  // 构造本地 uploading 文件项
  const newFiles = files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: isImageType(file.type) ? "image" : "file",
    status: "uploading",
    file,
  }));
  useChatStore.getState().addFiles(newFiles);

  // 并发上传
  const currentConversationId = useConversation.getState().currentConversationId;
  newFiles.forEach(({ id, name, file }) => {
    server
      .uploadFileByCoze(file, currentConversationId)
      .then((response) => {
        const { id: newId, url } = response.data || {};
        useChatStore.getState().updateFile(id, { id: newId, status: "done", url });
        antdMessage.success(`文件上传成功: ${name}`);
      })
      .catch((error) => {
        useChatStore.getState().removeFile(id);
        antdMessage.error(`文件上传失败: ${name}，${error.message || "请稍后再试"}`);
      });
  });
}

/** 取消文件上传 */
export function cancelFileUpload(fileId, filename) {
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

/** 标记是否为第一次发送消息（影响是否加载历史消息） */
export function handleFirstChange(isFirst) {
  useChatStore.getState().setIsFirst(!!isFirst);
}

/** 重置聊天流程（不清除文件） */
export function resetChatFlow() {
  useMessages.getState().reset();
  useChatStore.getState().resetFlowFlags();
}