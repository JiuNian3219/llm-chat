import IconButton from "@/base/components/IconButton";
import useIsMobile from "@/base/hooks/useIsMobile";
import {
  cancelCurrentStream,
  sendStreamMessage,
} from "@/domain/chat/services/chatService";
import { useChatStore } from "@/domain/chat/stores/chatStore";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import type { StreamChatCallbacks } from "@/src/types/services";
import { ChatStatus } from "@/src/types/store";
import { ArrowUpOutlined } from "@ant-design/icons";
import { Divider, Flex, Select } from "antd";
import type { CSSProperties, KeyboardEvent } from "react";
import { useState } from "react";
import FileQueue from "../../structure/FileQueue";
import FileUploadButton from "../FileUploadButton";
import MultilineInput from "../MultilineInput";
import styles from "./index.module.css";

interface AIInputPanelProps {
  callbacks?: StreamChatCallbacks;
  className?: string;
  style?: CSSProperties;
}

/**
 * AI输入面板
 * @param props - 组件属性
 * @param props.callbacks - 回调函数
 * @param props.callbacks.onStart - 发送消息的回调函数
 * @param props.callbacks.onMessage - 接收消息的回调函数
 * @param props.callbacks.onCompleted - 完成消息的回调函数
 * @param props.callbacks.onFollowUp - 跟进消息的回调函数
 * @param props.callbacks.onDone - 完成消息的回调函数
 * @param props.callbacks.onError - 错误回调函数
 * @param props.className - 组件类名
 * @param props.style - 组件样式
 * @returns
 */
const AIInputPanel = ({ callbacks, className, style }: AIInputPanelProps) => {
  const options = [{ value: "LLM", label: "LLM Chat" }];
  const [message, setMessage] = useState("");
  const status = useChatStore((s) => s.status);
  const isGenerating = status === ChatStatus.Generating;
  const files = useChatStore((s) => s.files);
  const currentChatId = useChatStore((s) => s.currentChatId);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const currentConversationId = useConversation((s) => s.currentConversationId);
  const isMobile = useIsMobile();

  const handleSendMessage = () => {
    if (!message) return;
    sendStreamMessage({
      message,
      callbacks,
      conversationId: currentConversationId || undefined,
    });
    setMessage("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // 如果按下的是Ctrl + Enter，则发送消息
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      if (isGenerating || isLoadingMessages) return;
      handleSendMessage();
    }
  };

  return (
    <div
      className={`${styles["ai-input-panel-box"]} ${className || ""}`}
      onKeyDown={handleKeyDown}
      style={style}
    >
      <FileQueue
        files={files}
        className={styles["file-queue"]}
      />
      <MultilineInput
        value={message}
        onChange={setMessage}
        placeholder={`在这里开始与LLM Chat对话${!isMobile ? "（Ctrl + Enter发送，Enter换行）" : ""}`}
        minRows={isMobile ? 1 : 2}
        maxRows={isMobile ? 6 : 8}
      />
      <Divider
        style={{ margin: isMobile ? "4px 0px 8px 0px" : "6px 0px 12px 0px" }}
      />
      <Flex
        justify="space-between"
        align="center"
      >
        <Select
          defaultValue={options[0].label}
          options={options}
          size={isMobile ? "small" : undefined}
        ></Select>
        <Flex
          gap={8}
          align="center"
        >
          <FileUploadButton />
          <IconButton
            icon={
              !isGenerating ? (
                <ArrowUpOutlined />
              ) : (
                <div className={styles["stop-button-icon"]} />
              )
            }
            onClick={!isGenerating ? handleSendMessage : cancelCurrentStream}
            loading={!currentChatId && isGenerating}
            disabled={isLoadingMessages}
            type="primary"
            size={isMobile ? "small" : "medium"}
          />
        </Flex>
      </Flex>
    </div>
  );
};

export default AIInputPanel;
