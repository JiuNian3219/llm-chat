import server from "@/domain/chat/services";
import { App } from "antd";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useImmer } from "use-immer";
import { UPLOAD_LIMITS } from "../../const";
import {
  formatServerMessages,
  generateMultimodalMessage,
  isImageType,
} from "../../utils";
import { useConversationContext } from "../useConversationContext";

/**
 * @typedef {Object} SendMessageParams
 * @property {string} message - 用户输入的消息
 * @property {Array<File>} [attachments] - 附带的文件列表
 * @property {Object} [callbacks] - 回调函数
 * @property {function} [callbacks.onStart] - 成功回调
 * @property {function} [callbacks.onMessage] - 接收消息的回调函数
 * @property {function} [callbacks.onCompleted] - 完成消息的回调函数
 * @property {function} [callbacks.onFollowUp] - 后续建议消息的回调函数
 * @property {function} [callbacks.onDone] - 完成消息的回调函数
 * @property {function} [callbacks.onError] - 错误消息的回调函数
 * @property {string} [conversationId] - 会话ID
 */

/**
 * @typedef {Object} ChatContextType
 * @property {Object[]} messages - 聊天消息列表
 * @property {Object[]} files - 聊天文件列表
 * @property {string|null} currentChatId - 当前聊天ID
 * @property {string|null} currentConversationId - 当前会话ID
 * @property {boolean} isChatCompleted - 聊天是否已完成
 * @property {boolean} isLoadingMessages - 是否正在加载消息
 * @property {boolean} isFirst - 是否是第一次发送消息
 * @property {function(SendMessageParams): void} sendStreamMessage - 发送流式消息函数
 * @property {function(): Promise<void>} cancelCurrentStream - 取消当前流式对话函数
 * @property {function(Array<File>): void} uploadFiles - 处理文件上传函数
 * @property {function(string, string): void} cancelFileUpload - 取消文件上传函数
 * @property {function(): void} initializeChatProvider - 初始化聊天提供者函数
 * @property {function(boolean): void} handleFirstChange - 处理第一次发送消息的逻辑
 */

/** @type {import('react').Context<ChatContextType|null>} */
export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useImmer([]);
  const [files, setFiles] = useImmer([]);
  // 是否是在会话第一次发送信息
  const [isFirst, setIsFirst] = useState(false);
  const [isChatCompleted, setIsChatCompleted] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const { message: messageApi } = App.useApp();
  const cancelStreamRef = useRef(null);
  const { addNewConversation, currentConversationId } =
    useConversationContext();

  /**
   * 加载会话消息
   * @param {string} conversationId - 会话ID
   */
  const loadConversationMessages = async (conversationId) => {
    // 如果是在新会话中第一次发送消息，则不加载会话消息
    if (isFirst) return;
    resetChatState();
    if (!conversationId) return;

    try {
      setIsLoadingMessages(true);
      const response = await server.getConversationDetail(conversationId);
      const { conversation } = response.data;
      const { messages: serverMessages } = conversation;

      setMessages(formatServerMessages(serverMessages));
    } catch (error) {
      console.error("获取会话消息失败:", error);
      messageApi.error("获取会话消息失败，请稍后再试");
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /**
   * 向AI发送消息
   * @param {Object} params - 参数对象
   * @param {string} params.message - 用户输入的消息
   * @param {Array<File>} [params.attachments] - 附带的文件列表
   * @param {object} [params.callbacks] - 回调函数
   * @param {function} [params.callbacks.onStart] - 成功回调
   * @param {function} [params.callbacks.onMessage] - 接收消息的回调函数
   * @param {function} [params.callbacks.onCompleted] - 完成消息的回调函数
   * @param {function} [params.callbacks.onFollowUp] - 后续建议消息的回调函数
   * @param {function} [params.callbacks.onDone] - 完成消息的回调函数
   * @param {function} [params.callbacks.onError] - 错误消息的回调函数
   * @param {string} [params.conversationId] - 会话ID
   */
  const sendStreamMessage = async ({
    message,
    attachments,
    callbacks,
    conversationId,
  }) => {
    const trimmedMessage = message?.trim();
    if (!trimmedMessage) return;
    const messageFiles = attachments || files || [];
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedMessage,
      conversationId,
      files: messageFiles,
    };

    setMessages((draft) => {
      draft.push(userMessage);
    });

    const aiMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      followUps: [],
      // 用于标记该消息是否加载中
      isLoading: true,
      isCancel: false,
    };
    setMessages((draft) => {
      draft.push(aiMessage);
    });

    const contentType = messageFiles.length > 0 ? "object_string" : "text";
    const content =
      contentType === "object_string"
        ? generateMultimodalMessage(trimmedMessage, messageFiles)
        : trimmedMessage;

    const { onStart, onMessage, onCompleted, onFollowUp, onDone, onError } =
      callbacks || {};

    setIsChatCompleted(false);

    // 如果没有附件，则清空文件列表
    if (!attachments) {
      setFiles([]);
    }

    try {
      // 记录当前的流式对话取消函数
      cancelStreamRef.current = server.streamChatByCoze(
        content,
        contentType,
        {
          onStart: (data) => {
            // 添加新的会话到会话列表
            addNewConversation(data.conversationId, "新对话");
            onStart?.(data);
          },
          onMessage: (data) => {
            if (data.chatId !== currentChatId) {
              setCurrentChatId(data.chatId);
              setMessages((draft) => {
                const index = draft.findIndex(
                  (item) => item.id === aiMessage.id
                );
                if (index !== -1) {
                  draft[index].chatId = data.chatId;
                }
              });
            }
            setMessages((draft) => {
              const index = draft.findIndex((item) => item.id === aiMessage.id);
              if (index !== -1) {
                draft[index].content += data.content;
              }
            });
            onMessage?.(data);
          },
          onCompleted: (data) => {
            setMessages((draft) => {
              const index = draft.findIndex((item) => item.id === aiMessage.id);
              if (index !== -1) {
                draft[index].isLoading = false;
              }
            });
            onCompleted?.(data);
          },
          onFollowUp: (data) => {
            setMessages((draft) => {
              const index = draft.findIndex((item) => item.id === aiMessage.id);
              if (index !== -1) {
                draft[index].followUps.push(data.content);
              }
            });
            onFollowUp?.(data);
          },
          onDone: (data) => {
            // 保证消息加载完成后，设置聊天状态为完成
            setTimeout(() => {
              setIsChatCompleted(true);
              setCurrentChatId(null);
            }, 1000);
            // 清除取消流函数
            cancelStreamRef.current = null;
            handleFirstChange(false);
            onDone?.(data);
          },
          onError: (error) => {
            cancelStreamRef.current = null;
            setIsChatCompleted(true);
            setCurrentChatId(null);
            handleFirstChange(false);
            const errorText = error?.error || error?.message || "AI对话发生错误，请稍后再试";
            setMessages((draft) => {
              const index = draft.findIndex((item) => item.id === aiMessage.id);
              if (index !== -1) {
                draft[index].isLoading = false;
                draft[index].isCancel = false;
                draft[index].isError = true;
                draft[index].content = errorText;
              }
            });
            messageApi.error(errorText);
            onError?.(error);
          },
        },
        currentConversationId
      );
    } catch (error) {
      cancelStreamRef.current = null;
      setIsChatCompleted(true);
      setCurrentChatId(null);
      handleFirstChange(false);
      const errorText = error?.message || "AI对话发生错误，请稍后再试";
      setMessages((draft) => {
        const index = draft.findIndex((item) => item.id === aiMessage.id);
        if (index !== -1) {
          draft[index].isLoading = false;
          draft[index].isCancel = false;
          draft[index].isError = true;
          draft[index].content = errorText;
        }
      });
      messageApi.error(errorText);
    }
  };

  /**
   * 重设此ChatProvider，不清除文件列表
   */
  const resetChatState = () => {
    setMessages(() => []);
    setIsChatCompleted(true);
    setCurrentChatId(null);
    cancelStreamRef.current = null;
  };

  /**
   * 取消当前的流式对话
   */
  const cancelCurrentStream = async () => {
    if (
      !cancelStreamRef.current ||
      !currentChatId ||
      !currentConversationId ||
      isChatCompleted
    )
      return;
    const response = await server.cancelChatByCoze(
      currentConversationId,
      currentChatId
    );
    const { status } = response.data;
    if (status === "canceled") {
      setMessages((draft) => {
        const index = draft.findIndex((item) => item.chatId === currentChatId);
        if (index !== -1) {
          draft[index].isLoading = false;
          draft[index].isCancel = true;
        }
      });
      setIsChatCompleted(true);
      setCurrentChatId(null);
      cancelStreamRef?.current();
      messageApi.success("对话已取消");
    } else {
      messageApi.error("取消对话失败，请稍后再试");
    }
  };

  /**
   * 上传文件
   * @param {Array<File>} files - 要上传的文件
   */
  const uploadFiles = (files) => {
    if (!files || files.length === 0) return;
    if (files.length > UPLOAD_LIMITS.maxFileCount) {
      messageApi.warning("一次最多只能上传10个文件");
      return;
    }

    const newFiles = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: isImageType(file.type) ? "image" : "file",
      status: "uploading",
      file: file,
    }));

    setFiles((prevFiles) => [...prevFiles, ...newFiles]);

    newFiles.forEach((fileInfo) => {
      const { id, name, file } = fileInfo;
      server
        .uploadFileByCoze(file, currentConversationId)
        .then((response) => {
          // 立即更新成功的文件状态
          const { id: newId, url } = response.data;
          setFiles((draft) => {
            const index = draft.findIndex((f) => f.id === id);
            if (index !== -1) {
              draft[index] = {
                ...draft[index],
                id: newId,
                status: "done",
                url: url,
              };
            }
          });
          messageApi.success(`文件上传成功: ${name}`);
        })
        .catch((error) => {
          // 失败后删除文件并显示错误消息
          setFiles((draft) => {
            const index = draft.findIndex((f) => f.id === id);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          });
          messageApi.error(
            `文件上传失败: ${name}，${error.message || "请稍后再试"}`
          );
        });
    });
  };

  /**
   * 取消文件上传
   * @param {string} fileId - 文件ID
   * @param {string} filename - 文件名
   */
  const cancelFileUpload = (fileId, filename) => {
    if (!fileId || !filename) {
      return;
    }

    // 查找文件并更新状态
    setFiles((draft) => {
      const index = draft.findIndex((f) => f.id === fileId);
      if (index !== -1) {
        draft[index].status = "canceling";
      }
    });

    server
      .cancelFileUploadByCoze(fileId, filename)
      .then((result) => {
        const { status } = result.data;
        if (status === "canceled") {
          // 成功取消后从列表中移除
          setFiles((draft) => {
            const index = draft.findIndex((f) => f.id === fileId);
            if (index !== -1) {
              draft.splice(index, 1);
            }
          });
        } else {
          new Error("取消文件上传失败");
        }
      })
      .catch((error) => {
        // 如果取消失败，恢复文件状态
        setFiles((draft) => {
          const index = draft.findIndex((f) => f.id === fileId);
          if (index !== -1) {
            draft[index].status = "done";
          }
        });
        messageApi.error(`取消文件上传失败: ${filename}`);
      });
  };

  /**
   * 处理第一次发送消息的逻辑
   * @param {boolean} isFirst - 是否是第一次发送消息
   */
  const handleFirstChange = (isFirst) => {
    setIsFirst(isFirst);
  }

  useEffect(() => {
    loadConversationMessages(currentConversationId);
  }, [currentConversationId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        files,
        currentChatId,
        currentConversationId,
        isChatCompleted,
        isLoadingMessages,
        isFirst,
        sendStreamMessage,
        cancelCurrentStream,
        uploadFiles,
        cancelFileUpload,
        initializeChatProvider: resetChatState,
        handleFirstChange,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

/**
 * 自定义Hook，用于获取聊天上下文
 * @returns {ChatContextType}
 */
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext 必须在 ChatProvider 内部使用");
  }
  return context;
};
