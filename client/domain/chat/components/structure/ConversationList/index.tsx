import IconButton from "@/base/components/IconButton";
import type { MouseEvent } from "react";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { MoreOutlined } from "@ant-design/icons";
import { Flex, Skeleton } from "antd";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.css";

interface ConversationListProps {
  style?: CSSProperties;
  className?: string;
}

/**
 * 会话列表组件
 * @param props - 组件属性
 * @param props.style - 组件样式
 * @param props.className - 组件类名
 * @returns
 */
const ConversationList = ({ style, className }: ConversationListProps) => {
  const conversations = useConversation((s) => s.conversations);
  const currentConversationId = useConversation((s) => s.currentConversationId);
  const isLoadingList = useConversation((s) => s.isLoadingList);
  const navigate = useNavigate();

  const handleConversationClick = (id: string) => {
    // 如果点击的会话已经是当前会话，则不进行跳转
    if (id === currentConversationId) return;
    navigate(`/chat/${id}`, { replace: true });
  };

  // 渲染骨架屏
  const renderSkeletons = () => (
    <Flex
      vertical
      gap={8}
      className={styles["conversation-list-skeleton-container"]}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton.Button
          key={index}
          active
          block
          className={styles["conversation-list-skeleton"]}
        />
      ))}
    </Flex>
  );

  // 渲染会话列表
  const renderList = () => (
    <>
      {conversations.length > 0 ? (
        conversations.map(({ conversationId, title }) => (
          <div
            key={conversationId}
            className={`${styles["conversation-item"]} ${currentConversationId === conversationId ? styles["selected"] : ""}`}
            onClick={() => handleConversationClick(conversationId)}
          >
            <span className={styles["conversation-item-title"]}>
              {title || "新会话"}
            </span>
            {/** 暂时未加入编辑选项 */}
            <IconButton
              className={styles["conversation-item-control"]}
              type="text"
              icon={<MoreOutlined />}
              onClick={(e: MouseEvent) => e.stopPropagation()}
            />
          </div>
        ))
      ) : (
        <Flex
          vertical
          justify="center"
          align="center"
          className={styles["no-conversations"]}
        >
          <span>暂无会话</span>
        </Flex>
      )}
    </>
  );

  return (
    <Flex
      vertical
      gap={8}
      style={style}
      className={`${styles["conversation-list"]} ${className || ""}`}
    >
      {isLoadingList ? renderSkeletons() : renderList()}
    </Flex>
  );
};

export default ConversationList;
