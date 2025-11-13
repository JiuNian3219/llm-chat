import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIGreeting from "@/domain/chat/components/AIGreeting";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { handleFirstChange } from "@/domain/chat/services/chatService";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { useMessages } from "@/domain/chat/stores/messageStore";
import { Flex } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.css";

const Home = () => {
  const messageCount = useMessages((s) => s.messageIds.length);
  const [inBottom, setInBottom] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const navigate = useNavigate();
  const hideTimeout = useRef(null);

  useEffect(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    // 检测消息数量是否为空
    setInBottom(messageCount !== 0);
    hideTimeout.current = setTimeout(() => {
      setShouldHide(messageCount > 0);
    }, 350);
  }, [messageCount > 0]);

  // 进入首页时重置当前会话标识与标题
  useEffect(() => {
    const { setCurrentConversationId, setCurrentTitle } = useConversation.getState();
    setCurrentConversationId(null);
    setCurrentTitle("");
  }, []);

  /**
   * 处理开始事件
   * @param {object} data - 回调数据，包含 conversationId
   */
  const handleStart = (data) => {
    handleFirstChange(true);
    setTimeout(() => {
      const { conversationId } = data;
      navigate("/chat/" + conversationId, {
        replace: true,
      });
    }, 1000);
  };

  return (
    <Flex
      vertical
      justify="center"
      align="center"
      gap="10px"
      className={styles["home-container"]}
    >
      <AIGreeting
        title="你好，我是LLM Chat，很高兴见到你！"
        description="我可以帮你写代码、读文件、写错各种创意内容，请把你的任务交给我吧~"
        style={{
          opacity: inBottom ? "0" : "1",
          height: inBottom ? "0" : "fit-content",
          display: shouldHide ? "none" : "flex",
        }}
        className={styles.greeting}
      />
      <ChatMessages
        style={{
          flex: inBottom ? "1" : "0",
        }}
        className={styles.messages}
      />
      <Flex vertical>
        <AIInputPanel
          callbacks={{
            onStart: handleStart,
          }}
          className={styles.input}
        />
        <AIFooterTip />
      </Flex>
    </Flex>
  );
};
export default Home;
