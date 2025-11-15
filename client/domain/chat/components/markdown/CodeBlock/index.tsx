import IconButton from "@/base/components/IconButton";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";
import { Flex } from "antd";
import type { ReactNode } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./index.module.css";

interface CodeBlockProps {
  children?: ReactNode;
  /** 文本是否输出完成（控制复制按钮） */
  isCompleted?: boolean;
  className?: string;
  [key: string]: any;
}

/**
 * Markdown 代码块组件
 */
const CodeBlock = ({
  children,
  isCompleted,
  className,
  ...props
}: CodeBlockProps) => {
  const { copyText, getCopyIcon } = useCopyToClipboard();
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const childrenString = String(children).replace(/\n$/, "");

  if (!match) {
    return (
      <code
        className={styles["inline-code"]}
        {...props}
      >
        {children}
      </code>
    );
  }
  return (
    <div className={styles["code-container"]}>
      <Flex
        justify="space-between"
        align="center"
        className={styles["code-header"]}
      >
        <span>{language}</span>
        {isCompleted && (
          <IconButton
            type="text"
            size="small"
            shape="default"
            icon={getCopyIcon()}
            onClick={() => copyText(childrenString)}
            className={styles["copy-button"]}
          />
        )}
      </Flex>
      <SyntaxHighlighter
        wrapLongLines
        className={`${className} ${styles["code-block"]}`}
        customStyle={{
          padding: "16px",
          marginTop: 0,
        }}
        style={vscDarkPlus}
        language={language}
        {...props}
      >
        {childrenString}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
