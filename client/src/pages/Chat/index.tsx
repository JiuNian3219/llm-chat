import IconButton from "@/base/components/IconButton";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import { loadConversationMessages } from "@/domain/chat/services/chatService";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { ArrowDownOutlined } from "@ant-design/icons";
import { Flex, Spin, theme } from "antd";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

const Chat = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const isChatCompleted = useChatStore((s) => s.isChatCompleted);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const boxRef = useRef<HTMLElement | null>(null);

  const { isAwayFromBottom, scrollToBottom } = useChatScroll({
    boxRef,
    isChatCompleted,
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
    if (!conversationId) {
      navigate("/", {
        replace: true,
      });
      return;
    }
    // 更新会话状态与标题，并加载会话消息
    const setCurrentConversationId =
      useConversation.getState().setCurrentConversationId;
    const fetchCurrentTitle = useConversation.getState().fetchCurrentTitle;
    setCurrentConversationId(conversationId);
    fetchCurrentTitle(conversationId);
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
          <Spin style={{}} />
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
