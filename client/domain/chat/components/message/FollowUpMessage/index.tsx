import { sendStreamMessage } from "@/domain/chat/services/chatService";
import { Button } from "antd";
import type { CSSProperties } from "react";
import styles from "./index.module.css";

interface FollowUpMessageProps {
  message: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * FollowUpMessage 组件
 * @param props - 组件属性
 * @param props.message - 展示信息
 * @param props.className - 额外的类名
 * @param props.style - 额外的样式
 * @returns
 */
const FollowUpMessage = ({
  message,
  className,
  style,
}: FollowUpMessageProps) => {
  const handleSendMessage = () => {
    if (!message) return;
    sendStreamMessage({ message });
  };

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
