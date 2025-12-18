import DotPulseLoader from "@/base/components/DotPulseLoader";
import IconButton from "@/base/components/IconButton";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useMessages } from "@/domain/chat/stores/messageStore";
import { WarningOutlined } from "@ant-design/icons";
import { Flex, Spin } from "antd";
import type { CSSProperties } from "react";
import { memo } from "react";
import FollowUpMessage from "../FollowUpMessage";
import MarkdownMessage from "../MarkdownMessage";
import styles from "./index.module.css";

interface AIMessageProps {
  messageId: string;
  isLast: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * AI 消息组件
 * @param props - 组件属性
 * @param props.messageId - 消息ID
 * @param props.isLast - 是否是最后一条消息
 * @param props.className - 额外的类名
 * @param props.style - 额外的样式
 * @returns
 */
const AIMessage = ({ messageId, isLast, className, style }: AIMessageProps) => {
  const {
    content,
    isLoading,
    isTextCompleted,
    followUps = [],
    isCancel,
    isError,
  } = useMessages((s) => s.messagesById[messageId] || {});
  const isChatCompleted = useChatStore((s) => s.isChatCompleted);
  const { copyText, getCopyIcon } = useCopyToClipboard();
  const hasContent = !!content;
  // 是否展示加载态，当正在加载，没有内容，不是取消，不是错误时展示
  const showLoader = isLoading && !hasContent && !isCancel && !isError;
  const showError = !!isError;
  // 是否应该展示操作按钮，当有内容，不是加载中，不是取消，不是错误时展示
  const showActions = hasContent && !isLoading && !isCancel && !isError;
  // 是否展示后续消息，当不是加载中，不是取消，是最后一条消息时展示
  const showFollowUps = !isLoading && !isCancel && !!isLast;
  // 是否展示取消提示，当是取消，是最后一条消息时展示
  const showCancelTip = !!isCancel;
  const isFollowUpsLoading =
    !!isTextCompleted && followUps.length === 0 && !isChatCompleted;
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
      {showLoader ? (
        <DotPulseLoader />
      ) : (
        <>
          {showError ? (
            <Flex
              className={styles["error-message"]}
              align="flex-start"
              gap={8}
            >
              <WarningOutlined className={styles["error-icon"]} />
              <div className={styles["error-text"]}>{content}</div>
            </Flex>
          ) : (
            <>
              <MarkdownMessage
                message={content}
                isCompleted={!!isTextCompleted}
              />
              {showActions && (
                <Flex className={styles["button-container"]}>
                  <IconButton
                    type="text"
                    shape="default"
                    size="small"
                    icon={getCopyIcon()}
                    onClick={handleCopyMessage}
                    className={styles["copy-button"]}
                  />
                </Flex>
              )}
            </>
          )}
          {showFollowUps && (
            <Flex
              vertical={followUps.length > 0}
              gap={4}
            >
              {isFollowUpsLoading ? (
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
      {showCancelTip && (
        <Flex
          justify="center"
          align="center"
          className={styles["cancel-message"]}
        >
          <span>AI已取消继续输出该信息</span>
        </Flex>
      )}
    </Flex>
  );
};

export default memo(AIMessage);
