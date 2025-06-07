import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIGreeting from "@/domain/chat/components/AIGreeting";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import { Flex } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.css";

const Home = () => {
  const { messages, handleFirstChange } = useChatContext();
  const [inBottom, setInBottom] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const navigate = useNavigate();
  const hideTimeout = useRef(null);

  useEffect(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    // 检测 messages 数组是否为空
    setInBottom(messages.length !== 0);
    hideTimeout.current = setTimeout(() => {
      setShouldHide(messages.length > 0);
    }, 350);
  }, [messages.length > 0]);

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
