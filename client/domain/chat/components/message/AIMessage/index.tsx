import DotPulseLoader from "@/base/components/DotPulseLoader";
import IconButton from "@/base/components/IconButton";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { MessageStatus } from "@/src/types/message";
import { ChatStatus } from "@/src/types/store";
import { WarningOutlined } from "@ant-design/icons";
import { Flex, Spin } from "antd";
import type { CSSProperties } from "react";
import { memo } from "react";
import FollowUpMessage from "../FollowUpMessage";
import MarkdownMessage from "../MarkdownMessage";
import ReasoningBlock from "../ReasoningBlock";
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
  const msg = useChatStore((s) => s.messagesById[messageId]);
  const chatStatus = useChatStore((s) => s.status);
  const { copyText, getCopyIcon } = useCopyToClipboard();

  const { content = "", status = MessageStatus.Pending, followUps = [], reasoning = "" } = msg || {};

  // status 已经完整表达消息状态，直接推导各 UI 开关
  const isCompleted = status !== MessageStatus.Pending && status !== MessageStatus.Streaming;
  // 有 reasoning 内容时，不显示 loading 动画
  const showLoader = status === MessageStatus.Pending && !reasoning;
  const showReasoning = !!reasoning;
  const showError = status === MessageStatus.Error;
  // 显示操作按钮：内容已完成且有实际文本
  const showActions = status === MessageStatus.Completed && !!content;
  // 显示 follow-up 区域：消息已完成且是最后一条
  const showFollowUps = status === MessageStatus.Completed && isLast;
  const showCancelTip = status === MessageStatus.Canceled;
  // follow_up 加载中：文本已完成（Completed）但还未收到任何建议，且会话仍在生成
  const isFollowUpsLoading =
    status === MessageStatus.Completed && followUps.length === 0 && chatStatus === ChatStatus.Generating;

  const handleCopyMessage = async () => {
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
              {showReasoning && (
                <ReasoningBlock
                  reasoning={reasoning}
                  isStreaming={!isCompleted}
                />
              )}
              <MarkdownMessage
                message={content}
                isCompleted={isCompleted}
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
                    style={{ animationDelay: `${index * 0.05}s` }}
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
