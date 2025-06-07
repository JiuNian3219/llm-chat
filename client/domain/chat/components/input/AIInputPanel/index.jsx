import IconButton from "@/base/components/IconButton";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import { ArrowUpOutlined, BorderOutlined } from "@ant-design/icons";
import { Divider, Flex, Select } from "antd";
import { useState } from "react";
import MultilineInput from "../MultilineInput";
import styles from "./index.module.css";
import FileUploadButton from "../FileUploadButton";
import FileQueue from "../../structure/FileQueue";

/**
 * AI输入面板组件
 * @param {object} props - 组件属性
 * @param {object} [props.callbacks] - 回调函数
 * @param {function} [props.callbacks.onStart] - 发送消息的回调函数
 * @param {function} [props.callbacks.onMessage] - 接收消息的回调函数
 * @param {function} [props.callbacks.onCompleted] - 完成消息的回调函数
 * @param {function} [props.callbacks.onFollowUp] - 跟进消息的回调函数
 * @param {function} [props.callbacks.onDone] - 完成消息的回调函数
 * @param {function} [props.callbacks.onError] - 错误回调函数
 * @param {string} [props.className] - 组件类名
 * @param {import("react").CSSProperties} [props.style] - 组件样式
 * @returns
 */
const AIInputPanel = ({ callbacks, className, style }) => {
  const options = [{ value: "LLM", label: "LLM Chat" }];
  const [message, setMessage] = useState("");
  const { sendStreamMessage, cancelCurrentStream, isChatCompleted, files, currentChatId, currentConversationId, isLoadingMessages } =
    useChatContext();

  const handleSendMessage = () => {
    if (!message) return;
    sendStreamMessage({ message, callbacks, conversationId: currentConversationId });
    setMessage("");
  };

  const handleKeyDown = (e) => {
    // 如果按下的是Ctrl + Enter，则发送消息
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      if (!isChatCompleted || isLoadingMessages) return;
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
        placeholder="在这里开始与LLM Chat对话（Ctrl + Enter发送，Enter换行）"
      />
      <Divider style={{ margin: "6px 0px 12px 0px" }} />
      <Flex
        justify="space-between"
        align="center"
      >
        <Select
          defaultValue={options[0].label}
          options={options}
        ></Select>
        <Flex
          gap={8}
          align="center"
        >
          <FileUploadButton />
          <IconButton
            icon={
              isChatCompleted ? (
                <ArrowUpOutlined />
              ) : (
                <div className={styles["stop-button-icon"]} />
              )
            }
            onClick={isChatCompleted ? handleSendMessage : cancelCurrentStream}
            loading={!currentChatId && !isChatCompleted}
            disabled={isLoadingMessages}
            type="primary"
          />
        </Flex>
      </Flex>
    </div>
  );
};

export default AIInputPanel;
