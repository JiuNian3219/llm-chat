import AIFooterTip from "@/domain/chat/components/AIFooterTip";
import AIInputPanel from "@/domain/chat/components/input/AIInputPanel";
import ChatMessages from "@/domain/chat/components/structure/ChatMessages";
import { Flex, theme } from "antd";
import styles from "./index.module.css";

const Chat = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return (
    <Flex
      vertical
      align="center"
      className={styles["chat-container"]}
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
        <AIInputPanel className={styles["input-panel"]} />
        <AIFooterTip />
      </Flex>
    </Flex>
  );
};

export default Chat;
