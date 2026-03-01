import IconButton from "@/base/components/IconButton";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import { loadConversationMessages } from "@/domain/chat/services/chatService";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { ChatStatus } from "@/src/types/store";
import { ArrowDownOutlined } from "@ant-design/icons";
import { Flex, Spin, theme } from "antd";
import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import styles from "./index.module.css";

const Chat = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const status = useChatStore((s) => s.status);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const setCurrentConversationId = useConversation((s) => s.setCurrentConversationId);
  const fetchCurrentTitle = useConversation((s) => s.fetchCurrentTitle);
  const { conversationId } = useParams();
  const location = useLocation();

  const boxRef = useRef<HTMLElement | null>(null);

  const { isAwayFromBottom, scrollToBottom } = useChatScroll({
    boxRef,
    isGenerating: status === ChatStatus.Generating,
  });

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

  useEffect(() => {
    if (!conversationId) return;
    setCurrentConversationId(conversationId);
    fetchCurrentTitle(conversationId);
    // Home 页首次发送消息后跳转时携带 skipLoad，避免覆盖正在生成的消息
    if (!location.state?.skipLoad) {
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
        <ChatMessages className={styles.messages} />
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
