import IconButton from "@/base/components/IconButton";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import {
  loadConversationMessages,
  loadMoreMessages,
} from "@/domain/chat/services/chatService";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { ChatStatus } from "@/src/types/store";
import { ArrowDownOutlined } from "@ant-design/icons";
import { Flex, Spin, theme } from "antd";
import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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
    setCurrentConversationId(conversationId);
    fetchCurrentTitle(conversationId);
    // loadConversationMessages 内部会检查 sseConversationId：
    // 若 SSE 已在为该会话生成（从首页跳转），直接返回保留动画；
    // 否则（刷新/切换会话）正常 reset + 拉取后端数据。
    loadConversationMessages(conversationId);
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
