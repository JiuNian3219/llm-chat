import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import AIMessage from "../../message/AIMessage";
import UserMessage from "../../message/UserMessage";
import styles from "./index.module.css";

/**
 * AI聊天消息组件 - 显示聊天记录
 * @param {object} props 
 * @returns 
 */
const ChatMessages = ({ className, style }) => {
  const { messages } = useChatContext();
  return (
    <div
      className={`${styles["chat-messages-container"]} ${className || ""}`}
      style={style}
    >
      {messages.map((message, index) => {
        const { role } = message;
        if (role === "user") {
          return (
            <UserMessage
              key={message.id || index}
              isLast={index === messages.length - 2}
              message={message}
            />
          );
        } else if (role === "assistant") {
          return (
            <AIMessage
              key={message.id || index}
              isLast={index === messages.length - 1}
              message={message}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default ChatMessages;
