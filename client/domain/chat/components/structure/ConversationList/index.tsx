import IconButton from "@/base/components/IconButton";
import { resetChatFlow } from "@/domain/chat/services/chatService";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { MoreOutlined } from "@ant-design/icons";
import {
  Dropdown,
  Flex,
  Input,
  Modal,
  Skeleton,
  message as antdMessage,
} from "antd";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleLinkClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (id === currentConversationId) {
      e.preventDefault();
    }
  };

  const beginRename = (id: string) => {
    const conv = useConversation
      .getState()
      .conversations.find((c) => c.conversationId === id);
    setEditingId(id);
    setEditingTitle(conv?.title || "");
    setMenuOpenId(null);
  };

  const commitRename = async (id: string, newTitleRaw: string) => {
    const newTitle = (newTitleRaw || "").trim().slice(0, 30) || "新对话";
    try {
      await useConversation.getState().renameConversation(id, newTitle);
      antdMessage.success("已重命名");
    } catch (error: any) {
      antdMessage.error(error?.message || "重命名失败，请稍后再试");
    } finally {
      setEditingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setMenuOpenId(null);
    const conv = useConversation
      .getState()
      .conversations.find((c) => c.conversationId === id);
    const convTitle = (conv?.title || "").trim();
    Modal.confirm({
      title: "确认删除该会话？",
      content: `确定删除“${convTitle}”？删除后不可恢复。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          const wasCurrent =
            useConversation.getState().currentConversationId === id;
          await useConversation.getState().deleteConversationAsync(id);
          if (wasCurrent) {
            resetChatFlow();
            navigate("/", { replace: true });
          }
          antdMessage.success("已删除会话");
        } catch (error: any) {
          antdMessage.error(error?.message || "删除失败，请稍后再试");
        }
      },
    });
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
        conversations.map(({ conversationId, title, titleReady }) => (
          <Link
            key={conversationId}
            to={`/chat/${conversationId}`}
            replace
            className={`${styles["conversation-item"]} ${currentConversationId === conversationId ? styles["selected"] : ""}`}
            onClick={(e) => handleLinkClick(e, conversationId)}
          >
            {editingId === conversationId ? (
              <Input
                ref={inputRef as any}
                value={editingTitle}
                className={styles["conversation-item-title"]}
                onClick={(e) => e.stopPropagation()}
                maxLength={30}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => commitRename(conversationId, editingTitle)}
                onPressEnter={() => commitRename(conversationId, editingTitle)}
              />
            ) : titleReady === false ? (
              <Skeleton.Input
                active
                size="small"
                className={styles["conversation-item-title"]}
              />
            ) : (
              <span
                title={title}
                className={styles["conversation-item-title"]}
              >
                {title || ""}
              </span>
            )}
            <Dropdown
              trigger={["click"]}
              open={menuOpenId === conversationId}
              onOpenChange={(open) =>
                setMenuOpenId(open ? conversationId : null)
              }
              menu={{
                items: [
                  { key: "rename", label: "重命名" },
                  { key: "delete", label: "删除" },
                ],
                onClick: (info) => {
                  info.domEvent?.stopPropagation();
                  if (info.key === "rename") {
                    beginRename(conversationId);
                  } else if (info.key === "delete") {
                    confirmDelete(conversationId);
                  }
                },
              }}
            >
              <IconButton
                className={styles["conversation-item-control"]}
                type="text"
                icon={<MoreOutlined />}
                onClick={(e: MouseEvent) => e.stopPropagation()}
              />
            </Dropdown>
          </Link>
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
