import { createContext, useContext, useState } from "react";
import { useImmer } from "use-immer";
import server from "@/domain/chat/services";
import { App } from "antd";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useImmer([]);
  const [isChatCompleted, setIsChatCompleted] = useState(false);
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

    const followUps = [];

    const { onStart, onMessage, onCompleted, onDone, onError } =
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
            if (data.messageType === "follow_up") {
              setMessages((draft) => {
                const index = draft.findIndex(
                  (item) => item.id === aiMessage.id
                );
                if (index !== -1) {
                  draft[index].isLoading = false;
                }
              });
              followUps.push(data.content);
              onCompleted?.(data);
            }
          },
          onDone: (data) => {
            setMessages((draft) => {
              const index = draft.findIndex((item) => item.id === aiMessage.id);
              if (index !== -1) {
                draft[index].followUps = followUps;
              }
            })
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

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext 必须在 ChatProvider 内部使用");
  }
  return context;
};
