import { createContext, useContext, useState } from "react";
import { useImmer } from "use-immer";
import server from "@/domain/chat/services";
import { App } from "antd";

/**
 * @typedef {Object} ChatContextType
 * @property {Object[]} messages - 聊天消息列表
 * @property {string|null} currentChatId - 当前聊天ID
 * @property {string|null} currentConversationId - 当前会话ID
 * @property {boolean} isChatCompleted - 聊天是否已完成
 * @property {function(string, Object=, string=): Promise<void>} handleSendMessage - 发送消息函数
 */

/** @type {import('react').Context<ChatContextType|null>} */
export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useImmer([]);
  const [isChatCompleted, setIsChatCompleted] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const { message: messageApi } = App.useApp();

  /**
   * 向AI发送消息
   * @param {string} message - 用户输入的消息
   * @param {object} [callbacks] - 回调函数
   * @param {function} [callbacks.onStart] - 成功回调
   * @param {function} [callbacks.onMessage] - 接收消息的回调函数
   * @param {function} [callbacks.onCompleted] - 完成消息的回调函数
   * @param {function} [callbacks.onFollowUp] - 后续建议消息的回调函数
   * @param {function} [callbacks.onDone] - 完成消息的回调函数
   * @param {function} [callbacks.onError] - 错误消息的回调函数
   * @param {string} [conversationId] - 会话ID
   */
  const handleSendMessage = async (message, callbacks, conversationId) => {
    message = message?.trim();
    if (!message) return;
    const useMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      conversationId,
    };

    setMessages((draft) => {
      draft.push(useMessage);
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

    const { onStart, onMessage, onCompleted, onFollowUp, onDone, onError } =
      callbacks || {};

    setIsChatCompleted(false);

    try {
      await server.streamChatByCoze(
        message,
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
            setIsChatCompleted(true);
            onDone?.(data);
          },
          onError: (error) => {
            setIsChatCompleted(true);
            messageApi.error("AI对话发生错误，请稍后再试");
            onError?.(error);
          },
        },
        conversationId
      );
    } catch (error) {
      // TODO: 需要处理系统错误
      console.error("流式聊天请求错误:", error);
    } finally {
      setIsChatCompleted(true);
      setCurrentChatId(null);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        currentChatId,
        currentConversationId,
        handleSendMessage,
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
