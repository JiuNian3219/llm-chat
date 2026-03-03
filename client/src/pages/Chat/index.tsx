import IconButton from "@/base/components/IconButton";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import {
  clearSSE,
  loadConversationMessages,
  loadMoreMessages,
} from "@/domain/chat/services/chatService";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { ChatStatus } from "@/src/types/store";
import { ArrowDownOutlined } from "@ant-design/icons";
import { Flex, Spin, theme } from "antd";
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

const Chat = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const status = useChatStore((s) => s.status);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const hasMoreMessages = useChatStore((s) => s.hasMoreMessages);
  const isLoadingMoreMessages = useChatStore((s) => s.isLoadingMoreMessages);
  const messageCount = useChatStore((s) => s.messageIds.length);
  const setCurrentConversationId = useConversation((s) => s.setCurrentConversationId);
  const fetchCurrentTitle = useConversation((s) => s.fetchCurrentTitle);
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const boxRef = useRef<HTMLElement | null>(null);
  /** 加载更多前记录的 scrollHeight，用于加载完成后恢复滚动位置 */
  const prevScrollHeightRef = useRef(0);

  const { isAwayFromBottom, scrollToBottom } = useChatScroll({
    boxRef,
    isGenerating: status === ChatStatus.Generating,
  });

  const handleLoadMore = useCallback(() => {
    if (!conversationId || isLoadingMoreMessages || !hasMoreMessages) return;
    prevScrollHeightRef.current = boxRef.current?.scrollHeight ?? 0;
    loadMoreMessages(conversationId);
  }, [conversationId, isLoadingMoreMessages, hasMoreMessages]);

  const handleScrollToBottom = () => {
    if (isAwayFromBottom) {
      scrollToBottom();
    }
  };

  const handleStart = () => {
    scrollToBottom();
  };

  useEffect(() => {
    // 数据加载完成后自动滚动到底部
    scrollToBottom(false);
  }, [isLoadingMessages]);

  // 滚动到顶部附近时触发加载更多
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (el.scrollTop <= 80 && hasMoreMessages && !isLoadingMoreMessages) {
        handleLoadMore();
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasMoreMessages, isLoadingMoreMessages, handleLoadMore]);

  // 消息前置完成后，还原滚动位置（防止视图跳动）
  useEffect(() => {
    if (prevScrollHeightRef.current === 0) return;
    const el = boxRef.current;
    if (el) {
      el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    }
  }, [messageCount]);

  useEffect(() => {
    if (!conversationId) return;
    const skipLoad = location.state?.skipLoad === true;
    if (skipLoad) {
      // 消费一次后立即清除，防止刷新时 session history 中残留的 state 导致跳过加载
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (!skipLoad) {
      clearSSE();
    }
    setCurrentConversationId(conversationId);
    fetchCurrentTitle(conversationId);
    if (!skipLoad) {
      loadConversationMessages(conversationId);
    }
  }, [conversationId]);

  return (
    <Flex
      vertical
      align="center"
      className={styles["chat-container"]}
      ref={boxRef}
    >
      {isLoadingMessages ? (
        <Flex
          vertical
          justify="center"
          align="center"
          flex={1}
        >
          <Spin />
        </Flex>
      ) : (
        <>
          {isLoadingMoreMessages && (
            <Flex justify="center" className={styles["load-more-spinner"]}>
              <Spin size="small" />
            </Flex>
          )}
          {!hasMoreMessages && messageCount > 0 && !isLoadingMoreMessages && (
            <Flex justify="center" className={styles["all-loaded-tip"]}>
              <span>已加载全部消息</span>
            </Flex>
          )}
          <ChatMessages className={styles.messages} />
        </>
      )}

      <Flex
        vertical
        align="center"
        className={styles["input-panel-box"]}
        style={{
          backgroundColor: colorBgContainer,
        }}
      >
        <div className={styles["scroll-button-box"]}>
          <IconButton
            icon={<ArrowDownOutlined />}
            className={styles["scroll-button"]}
            onClick={handleScrollToBottom}
            style={{
              display: isAwayFromBottom ? "block" : "none",
            }}
          />
        </div>
        <AIInputPanel
          callbacks={{
            onStart: handleStart,
          }}
          className={styles["input-panel"]}
        />
        <AIFooterTip />
      </Flex>
    </Flex>
  );
};

export default Chat;
