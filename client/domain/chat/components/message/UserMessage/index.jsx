import IconButton from "@/base/components/IconButton";
import styles from "./index.module.css";
import { EditOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import { useState } from "react";
import TextArea from "antd/es/input/TextArea";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";

/**
 * 用户消息组件 - 显示在右侧
 * @param {object} props - 组件属性
 * @param {object} props.message - 展示信息
 * @param {string} props.message.content - 消息内容
 * @param {boolean} props.isLast - 是否是最后一条消息
 * @param {string} [props.className] - 额外的类名
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @returns
 */
const UserMessage = ({ message, isLast, className, style }) => {
  const { content } = message;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(content || "");
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
  };

  /**
   * 处理输入框值变化
   * @param {object} e - 事件对象
   */
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
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
            <Button type="primary">发送</Button>
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
  );
};

export default UserMessage;
