import IconButton from "@/base/components/IconButton";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";
import { sendStreamMessage } from "@/domain/chat/services/chatService";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { EditOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import TextArea from "antd/es/input/TextArea";
import type { CSSProperties, ChangeEvent } from "react";
import { memo, useState } from "react";
import FileQueue from "../../structure/FileQueue";
import styles from "./index.module.css";

interface UserMessageProps {
  messageId: string;
  isLast: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * 用户消息组件（右侧展示）
 * @param props - 组件属性
 * @param props.messageId - 消息唯一标识
 * @param props.isLast - 是否为最后一条消息（控制按钮展示）
 * @param props.className - 组件类名
 * @param props.style - 组件样式
 * @returns 渲染后的用户消息组件
 */
const UserMessage = ({
  messageId,
  isLast,
  className,
  style,
}: UserMessageProps) => {
  const { content, files = [] } = useChatStore(
    (s) => s.messagesById[messageId] || {}
  );
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(content || "");
  const status = useChatStore((s) => s.status);
  const { copyText, getCopyIcon } = useCopyToClipboard();

  /**
   * 复制消息到剪贴板
   */
  const handleCopyMessage = async () => {
    // 如果没有消息则不执行复制操作
    if (!content) return;
    await copyText(content);
  };

  /**
   * 切换编辑状态
   */
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setInputValue(content || "");
  };

  /**
   * 处理输入框值变化
   * @param {object} e - 事件对象
   */
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    sendStreamMessage({ message: inputValue.trim(), attachments: files });
    toggleEdit();
  };

  return (
    <>
      <FileQueue
        files={files || []}
        close={false}
        direction="right"
        maxHeight={false}
      />
      <Flex
        vertical
        gap={4}
        className={`${styles["message-container"]} ${isLast ? styles["is-last"] : ""} ${className || ""}`}
      >
        <Flex
          align="center"
          justify="flex-end"
        >
          {isEditing ? (
            <TextArea
              autoSize={{ minRows: 2, maxRows: 8 }}
              value={inputValue}
              onChange={handleInputChange}
            />
          ) : (
            <div
              className={styles.message}
              style={style}
            >
              {content}
            </div>
          )}
        </Flex>
        <Flex
          align="center"
          justify="flex-end"
          gap={8}
          className={styles["button-container"]}
        >
          {isEditing ? (
            <>
              <Button
                type="text"
                onClick={toggleEdit}
              >
                取消
              </Button>
              <Button
                type="primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || status === "generating"}
              >
                发送
              </Button>
            </>
          ) : (
            <>
              <IconButton
                type="text"
                icon={getCopyIcon()}
                shape="default"
                size="small"
                onClick={handleCopyMessage}
                className={styles["copy-button"]}
              />
              <IconButton
                type="text"
                icon={<EditOutlined />}
                shape="default"
                size="small"
                onClick={toggleEdit}
                className={styles["edit-button"]}
              />
            </>
          )}
        </Flex>
      </Flex>
    </>
  );
};

export default memo(UserMessage);
