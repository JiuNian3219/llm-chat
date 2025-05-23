import IconButton from "@/base/components/IconButton";
import styles from "./index.module.css";
import {
  CopyOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { App, Button, Flex } from "antd";
import { copyText } from "@/domain/chat/utils";
import { useState, useEffect } from "react";
import TextArea from "antd/es/input/TextArea";

/**
 * 用户消息组件 - 显示在右侧
 * @param {object} props - 组件属性
 * @param {string} props.message - 展示信息
 * @param {string} [props.className] - 额外的类名
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @returns
 */
const UserMessage = ({ message, className, style }) => {
  // 复制状态，null表示未复制，'success'表示复制成功，'error'表示复制失败
  const [copyStatus, setCopyStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(message);
  const { message: messageApi } = App.useApp();

  // 当复制状态发生变化时，设置定时器，1秒后清除复制状态
  useEffect(() => {
    let timer;
    if (copyStatus) {
      timer = setTimeout(() => {
        setCopyStatus(null);
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [copyStatus]);

  /**
   * 复制消息到剪贴板
   */
  const copyMessage = async () => {
    // 如果没有消息或者复制状态不为null，则不执行复制操作
    if (!message || copyStatus != null) return;
    const result = await copyText(message, messageApi);
    if (result) {
      setCopyStatus("success");
    } else {
      setCopyStatus("error");
    }
  };

  /**
   * 获取复制图标，根据复制状态返回不同的图标
   */
  const getCopyIcon = () => {
    if (copyStatus === "success") {
      return <CheckOutlined className={styles["copy-success-icon"]} />;
    } else if (copyStatus === "error") {
      return <CloseOutlined className={styles["copy-error-icon"]} />;
    } else {
      return <CopyOutlined className={styles["copy-icon"]} />;
    }
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
      className={`${styles["message-container"]} ${className || ""}`}
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
            {message}
          </div>
        )}
      </Flex>
      <Flex
        align="center"
        justify="flex-end"
        gap={8}
      >
        {isEditing ? (
          <>
            <Button type="text" onClick={toggleEdit}>取消</Button>
            <Button type="primary">发送</Button>
          </>
        ) : (
          <>
            <IconButton
              type="text"
              icon={getCopyIcon()}
              shape="default"
              size="small"
              onClick={copyMessage}
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
