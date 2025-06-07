import IconButton from "@/base/components/IconButton";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import { ArrowDownOutlined } from "@ant-design/icons";
import { Flex, Spin, theme } from "antd";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./index.module.css";

const Chat = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { isChatCompleted, isLoadingMessages } = useChatContext();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const boxRef = useRef(null);

  const { isAwayFromBottom, scrollToBottom } = useChatScroll({
    boxRef,
    isChatCompleted,
  });

  const handleScrollToBottom = () => {
    if (isAwayFromBottom) {
      scrollToBottom();
    }
  };

  const handleStart = (data) => {
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
