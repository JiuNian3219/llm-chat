import server from "@/domain/chat/services";
import { createContext, useContext, useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { App } from "antd";

/**
 * @typedef {Object} ConversationContextType
 * @property {string|null} currentConversationId - 当前会话ID
 * @property {string} currentTitle - 当前会话标题
 * @property {Array} conversations - 会话列表
 * @property {boolean} isLoadingList - 是否正在加载会话列表
 * @property {boolean} isLoadingTitle - 是否正在加载会话标题
 * @property {function(): Promise<void>} refreshConversations - 刷新会话列表
 * @property {function(string, string): void} addNewConversation - 添加新会话到列表
 * @property {function(string, string): void} updateConversationTitle - 更新会话标题
 */

/** @type {import('react').Context<ConversationContextType|null>} */
const ConversationContext = createContext(null);

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("新对话");
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const { conversationId: currentConversationId } = useParams();
  const { pathname } = useLocation();
  const { message } = App.useApp();

  // 获取会话列表
  const fetchConversations = async () => {
    try {
      setIsLoadingList(true);
      const { data } = await server.getAllConversationList();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("获取会话列表失败:", error);
      message.error("获取会话列表失败，请稍后再试");
    } finally {
      setIsLoadingList(false);
    }
  };

  // 获取当前会话标题
  const fetchCurrentTitle = async (conversationId) => {
    if (!conversationId) {
      setCurrentTitle("");
      return;
    }

    try {
      setIsLoadingTitle(true);
      const { data } = await server.getConversationTitle(conversationId);
      setCurrentTitle(data.title || "新对话");
    } catch (error) {
      console.error("获取会话标题失败:", error);
      setCurrentTitle("新对话");
    } finally {
      setIsLoadingTitle(false);
    }
  };

  // 刷新会话列表
  const refreshConversations = async () => {
    await fetchConversations();
  };

  // 添加新会话到列表
  const addNewConversation = (conversationId, title = "新对话") => {
    setConversations((prev) => {
      // 检查是否已存在
      const exists = prev.some(
        (conv) => conv.conversationId === conversationId
      );
      if (exists) return prev;

      // 添加到列表顶部
      return [{ conversationId, title, updatedAt: new Date() }, ...prev];
    });
  };

  // 更新会话标题
  const updateConversationTitle = (conversationId, newTitle) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.conversationId === conversationId
          ? { ...conv, title: newTitle }
          : conv
      )
    );

    // 如果是当前会话，同时更新当前标题
    if (conversationId === currentConversationId) {
      setCurrentTitle(newTitle);
    }
  };

  // 监听路由变化，更新当前会话标题
  useEffect(() => {
    if (pathname === "/") {
      setCurrentTitle("");
    } else if (currentConversationId) {
      fetchCurrentTitle(currentConversationId);
    }
  }, [currentConversationId, pathname]);

  // 初始化时获取会话列表
  useEffect(() => {
    fetchConversations();
  }, []);

  const value = {
    currentConversationId,
    currentTitle,
    conversations,
    isLoadingList,
    isLoadingTitle,
    refreshConversations,
    addNewConversation,
    updateConversationTitle,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversationContext 必须在 ConversationProvider 内部使用"
    );
  }
  return context;
};
