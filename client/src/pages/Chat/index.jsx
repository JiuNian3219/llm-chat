import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { Flex, theme } from "antd";
import styles from "./index.module.css";
import IconButton from "@/base/components/IconButton";
import { ArrowDownOutlined } from "@ant-design/icons";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import { useEffect, useRef } from "react";

const Chat = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const { isChatCompleted, messages } = useChatContext();

  const boxRef = useRef(null);

  const { isAwayFromBottom, scrollToBottom } = useChatScroll({
    boxRef,
    isChatCompleted,
  });

  const handleScrollToBottom = () => {
    if (isAwayFromBottom) {
      scrollToBottom();
    }
  }

  useEffect(() => {
    // 有新消息时自动滚动到底部
    scrollToBottom(false);
  }, [messages.length]);

  return (
    <Flex
      vertical
      align="center"
      className={styles["chat-container"]}
      ref={boxRef}
    >
      <ChatMessages className={styles.messages} />
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
        <AIInputPanel className={styles["input-panel"]} />
        <AIFooterTip />
      </Flex>
    </Flex>
  );
};

export default Chat;
