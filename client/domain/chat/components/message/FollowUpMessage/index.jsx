import { Button } from "antd";
import styles from "./index.module.css";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";

/**
 * FollowUpMessage 组件
 * @param {object} props - 组件属性
 * @param {string} props.message - 展示信息
 * @param {string} [props.className] - 额外的类名
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @returns
 */
const FollowUpMessage = ({ message, className, style }) => {
  const { handleSendMessage: sendMessage } = useChatContext();

  const handleSendMessage = () => {
    if (!message) return;
    sendMessage(message);
  }

  return (
    <Button
      className={`${styles.follow} ${className}`}
      style={style}
      onClick={handleSendMessage}
    >
      {message}
    </Button>
  );
};

export default FollowUpMessage;
