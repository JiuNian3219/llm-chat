import IconButton from "@/base/components/IconButton";
import useCopyToClipboard from "@/domain/chat/hooks/useCopyToClipboard";
import { Flex } from "antd";
import type { ReactNode } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./index.module.css";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml);

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
