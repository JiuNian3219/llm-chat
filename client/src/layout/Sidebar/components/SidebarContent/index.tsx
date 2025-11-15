import ConversationList from "@/domain/chat/components/structure/ConversationList";
import { resetChatFlow } from "@/domain/chat/services/chatService";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.css";

interface SidebarContentProps {
  collapsed: boolean;
}
/**
 * 侧边栏内容组件，显示对话列表和新建对话按钮
 * @param props - 组件属性
 * @param props.collapsed - 是否折叠
 * @returns
 */
const SidebarContent = ({ collapsed }: SidebarContentProps) => {
  const navigate = useNavigate();
  const fetchConversations = useConversation((s) => s.fetchConversations);
  useEffect(() => {
    fetchConversations();
  }, []);
  const handleNewConversation = () => {
    resetChatFlow();
    navigate("/");
  };

  if (collapsed) {
    return (
      <>
        <Button
          type="text"
          onClick={handleNewConversation}
        >
          <PlusOutlined className={styles["button-icon"]} />
        </Button>
        <div className={styles["conversation-list-placeholder"]} />
      </>
    );
  }

  return (
    <>
      <div className={styles["new-conversation-button-container"]}>
        <Button
          onClick={handleNewConversation}
          className={styles["new-conversation-button"]}
        >
          <PlusOutlined className={styles["new-conversation-button-icon"]} />
          开启新对话
        </Button>
      </div>
      <span className={styles["conversation-list-title"]}>最近会话</span>
      <ConversationList className={styles["conversation-list"]} />
    </>
  );
};

export default SidebarContent;
