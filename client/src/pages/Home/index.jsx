import AIGreeting from "@/domain/chat/components/AIGreeting";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import { Flex } from "antd";
import { useEffect, useState } from "react";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import styles from "./index.module.css";

const Home = () => {
  const { messages } = useChatContext();
  const [ inBottom, setInBottom ] = useState(messages.length !== 0);
  const [ shouldHide, setShouldHide ] = useState(messages.length !== 0);

  useEffect(() => {
    // 检测 messages 数组是否为空
    setInBottom(messages.length !== 0);
    setTimeout(() => {
      setShouldHide(messages.length > 0);
    }, 350);
  }, [messages.length > 0]);
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
      <ChatMessages style={{
        flex: inBottom ? "1" : "0",
      }} className={styles.messages}/>
      <AIInputPanel className={styles.input}/>
      <AIFooterTip/>
    </Flex>
  );
};
export default Home;
