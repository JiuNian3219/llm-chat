import { Flex, Spin } from "antd";
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
 * @param {object} props.message - 展示信息
 * @param {string} props.message.content - 消息内容
 * @param {boolean} props.message.isLoading - 是否加载中
 * @param {Array} props.message.followUps - 后续消息
 * @param {boolean} props.isLast - 是否是最后一条消息
 * @param {string} [props.className] - 额外的类名
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @returns
 */
const AIMessage = ({ message, isLast, className, style }) => {
  const { content, isLoading, followUps } = message;
  const { copyText, getCopyIcon } = useCopyToClipboard();
  const handleCopyMessage = async () => {
    // 如果没有消息则不执行复制操作
    if (!content) return;
    await copyText(content);
  };

  return (
    <Flex
      vertical
      gap={4}
      style={style}
      className={`${styles["message-container"]} ${isLast ? styles["is-last"] : ""} ${className || ""}`}
    >
      {!content ? (
        <DotPulseLoader />
      ) : (
        <>
          <MarkdownMessage message={content} />
          {!isLoading && (
            <Flex className={styles["button-container"]}>
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
          {!isLoading && isLast && (
            <Flex
              vertical={followUps.length > 0}
              gap={4}
            >
              {followUps.length === 0 ? (
                <Spin className={styles.loading} />
              ) : (
                // 当 followUps 有内容时，显示建议列表
                followUps.map((item, index) => (
                  <FollowUpMessage
                    key={index}
                    message={item}
                    className="animation-fade-in"
                    style={{
                      animationDelay: `${index * 0.05}s`,
                    }}
                  />
                ))
              )}
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
};

export default AIMessage;
