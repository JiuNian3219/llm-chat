import { createContext, useContext, useState } from "react";
import { useImmer } from "use-immer";
import server from "@/domain/chat/services";
import { App } from "antd";
import { generateMultimodalMessage, isImageType } from "../../utils";
import { UPLOAD_LIMITS } from "../../const";
import { BASE_URL } from "@/base/const";

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
 * @property {function(SendMessageParams): void} handleSendMessage - 发送消息函数
 * @property {function(Array<File>): void} handleUploadFile - 上传文件函数
 * @property {function(string, string): void} handleCancelFileUpload - 取消文件上传函数
 */

/** @type {import('react').Context<ChatContextType|null>} */
export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useImmer([]);
  const [files, setFiles] = useImmer([]);
  const [isChatCompleted, setIsChatCompleted] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const { message: messageApi } = App.useApp();

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
  const handleSendMessage = async ({
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
      await server.streamChatByCoze(
        content,
        contentType,
        {
          onStart: (data) => {
            setCurrentConversationId(data.conversationId);
            setCurrentChatId(data.chatId);
            onStart?.(data);
          },
          onMessage: (data) => {
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
            onDone?.(data);
          },
          onError: (error) => {
            setIsChatCompleted(true);
            setCurrentChatId(null);
            messageApi.error("AI对话发生错误，请稍后再试");
            onError?.(error);
          },
        },
        conversationId
      );
    } catch (error) {
      setIsChatCompleted(true);
      setCurrentChatId(null);
      messageApi.error("AI对话发生错误，请稍后再试");
    }
  };

  /**
   * 上传文件
   * @param {Array<File>} files - 要上传的文件
   */
  const handleUploadFile = (files) => {
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
        .uploadFileByCoze(file)
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
                url: `${BASE_URL}${url}`,
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
  const handleCancelFileUpload = (fileId, filename) => {
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

  return (
    <ChatContext.Provider
      value={{
        messages,
        files,
        currentChatId,
        currentConversationId,
        handleSendMessage,
        handleUploadFile,
        handleCancelFileUpload,
        isChatCompleted,
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
