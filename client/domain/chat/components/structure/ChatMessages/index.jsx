import { useMessages } from "@/domain/chat/stores/messageStore";
import { memo } from "react";
import AIMessage from "../../message/AIMessage";
import UserMessage from "../../message/UserMessage";
import styles from "./index.module.css";

/**
 * AI聊天消息组件 - 显示聊天记录
 * @param {object} props 
 * @param {string} props.id - 消息ID
 * @param {number} props.index - 消息索引
 * @param {number} props.total - 消息总数
 * @returns 
 */
const MessageItem = ({ id, index, total }) => {
  const role = useMessages((s) => s.messagesById[id]?.role);
  if (role === "user") {
    return (
      <UserMessage
        key={id}
        isLast={index === total - 2}
        messageId={id}
      />
    );
  } else if (role === "assistant") {
    return (
      <AIMessage
        key={id}
        isLast={index === total - 1}
        messageId={id}
      />
    );
  }
  return null;
};

const MemoizedMessageItem = memo(MessageItem);

/**
 * 
 * @param {object} props
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @param {string} [props.className] - 额外的类名
 * @returns 
 */
const ChatMessages = ({ className, style }) => {
  const ids = useMessages((s) => s.messageIds);
  const total = ids.length;
  return (
    <div
      className={`${styles["chat-messages-container"]} ${className || ""}`}
      style={style}
    >
      {ids.map((id, index) => (
        <MemoizedMessageItem
          key={id}
          id={id}
          index={index}
          total={total}
        />
      ))}
    </div>
  );
};
export default memo(ChatMessages);
