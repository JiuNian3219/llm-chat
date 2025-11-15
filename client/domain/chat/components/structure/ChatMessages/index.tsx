import { useMessages } from "@/domain/chat/stores/messageStore";
import type { CSSProperties } from "react";
import { memo } from "react";
import AIMessage from "../../message/AIMessage";
import UserMessage from "../../message/UserMessage";
import styles from "./index.module.css";

interface MessageItemProps {
  id: string;
  index: number;
  total: number;
}

/**
 * 单条消息渲染项组件
 * @param props - 组件属性
 * @param props.id - 消息唯一标识
 * @param props.index - 当前索引
 * @param props.total - 消息总数
 * @returns 渲染后的消息组件
 */
const MessageItem = ({ id, index, total }: MessageItemProps) => {
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

interface ChatMessagesProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * 聊天消息列表组件
 * @param props - 组件属性
 * @param props.className - 组件类名
 * @param props.style - 组件样式
 * @returns 渲染后的聊天消息列表组件
 */
const ChatMessages = ({ className, style }: ChatMessagesProps) => {
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
