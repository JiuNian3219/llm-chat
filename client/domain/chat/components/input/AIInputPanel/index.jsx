import IconButton from "@/base/components/IconButton";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import { ArrowUpOutlined, PaperClipOutlined } from "@ant-design/icons";
import { Divider, Flex, Select } from "antd";
import { useState } from "react";
import MultilineInput from "../MultilineInput";
import styles from "./index.module.css";

/**
 * AI输入面板组件
 * @param {object} props - 组件属性
 * @param {string} [props.className] - 组件类名
 * @param {import("react").CSSProperties} [props.style] - 组件样式
 * @returns
 */
const AIInputPanel = ({ className, style }) => {
  const options = [{ value: "LLM", label: "LLM Chat" }];
  const [message, setMessage] = useState("");
  const { handleSendMessage: sendMessage, isChatCompleted } = useChatContext();

  const handleSendMessage = () => {
    if (!message) return;
    sendMessage(message);
    setMessage("");
  };

  return (
    <div
      className={`${styles["ai-input-panel-box"]} ${className || ""}`}
      style={style}
    >
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
          <IconButton
            icon={<PaperClipOutlined />}
          />
          <IconButton
            disabled={!message}
            icon={<ArrowUpOutlined />}
            onClick={handleSendMessage}
            loading={!isChatCompleted}
            type="primary"
          />
        </Flex>
      </Flex>
    </div>
  );
};

export default AIInputPanel;
