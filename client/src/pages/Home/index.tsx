import useIsMobile from "@/base/hooks/useIsMobile";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIGreeting from "@/domain/chat/components/AIGreeting";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { Flex } from "antd";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.css";
import { SSEStartData } from "@/src/types/services";

const Home = () => {
  const isMobile = useIsMobile();
  const messageCount = useChatStore((s) => s.messageIds.length);
  const [inBottom, setInBottom] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const navigate = useNavigate();
  const hideTimeout = useRef<number | null>(null);

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
    const { setCurrentConversationId, setCurrentTitle } =
      useConversation.getState();
    setCurrentConversationId(null);
    setCurrentTitle("");
  }, []);

  /**
   * 首次发送消息后跳转到聊天页
   * 携带 skipLoad 避免 Chat 页重新拉取消息覆盖正在生成的内容
   * @param data - 消息数据
   */
  const handleStart = (data: SSEStartData) => {
    setTimeout(() => {
      navigate("/chat/" + data.conversationId, {
        replace: true,
        state: { skipLoad: true },
      });
    }, 1000);
  };

  return (
    <Flex
      vertical
      justify={isMobile ? "space-between" : "center"}
      align="center"
      gap="10px"
      className={styles["home-container"]}
    >
      {/** 移动端下， 让 greeting 组件尽量处于居中位置 */}
      {isMobile && <div></div>}
      <AIGreeting
        title="你好，我是LLM Chat，很高兴见到你！"
        description="我可以帮你写代码、读文件、写出各种创意内容，请把你的任务交给我吧~"
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
      <Flex
        vertical
        className={styles["input-panel-box"]}
      >
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
