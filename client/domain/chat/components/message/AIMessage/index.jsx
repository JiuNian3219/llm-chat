import { Flex } from "antd";
import MarkdownMessage from "../MarkdownMessage";
import IconButton from "@/base/components/IconButton";
import { SyncOutlined } from "@ant-design/icons";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";
import styles from "./index.module.css";
import FollowUpMessage from "../FollowUpMessage";
import DotPulseLoader from "@/base/components/DotPulseLoader";

/**
 *
 * @param {object} props - 组件属性
 * @param {string} props.message - 展示信息
 * @param {Array} [props.followUps] - 后续提问列表
 * @param {string} [props.className] - 额外的类名
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @returns
 */
const AIMessage = ({ message, followUps = [], className, style }) => {
  // TODO: 需要根据实际情况设置加载状态
  const isLoading = false;
  // TODO: 需要根据实际情况设置是否完成状态
  const isCompleted = true;
  const { copyText, getCopyIcon } = useCopyToClipboard();
  const handleCopyMessage = async () => {
    // 如果没有消息则不执行复制操作
    if (!message) return;
    await copyText(message);
  };

  return (
    <Flex
      vertical
      gap={4}
      style={style}
      className={`${styles["message-container"]} ${className || ""}`}
    >
      {isLoading ? (
        <DotPulseLoader />
      ) : (
        <>
          <MarkdownMessage message={message} />
          {isCompleted && (
            <Flex className="animation-fade-in">
              <IconButton
                type="text"
                shape="default"
                size="small"
                icon={getCopyIcon()}
                onClick={handleCopyMessage}
                className={styles["copy-button"]}
              />
              <IconButton
                type="text"
                shape="default"
                size="small"
                icon={<SyncOutlined />}
                className={styles["reload-button"]}
              />
            </Flex>
          )}
          {followUps.length > 0 && isCompleted && (
            <Flex
              vertical
              gap={4}
            >
              {followUps.map((item, index) => (
                <FollowUpMessage
                  key={index}
                  message={item}
                  className="animation-fade-in"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                />
              ))}
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
};

export default AIMessage;