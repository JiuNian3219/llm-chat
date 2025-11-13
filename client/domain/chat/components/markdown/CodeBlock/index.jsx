import { Flex } from "antd";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./index.module.css";

/**
 * Markdown 代码块组件
 * @param {object} props - 组件属性 
 * @param {import("react").ReactNode} props.children - 代码块内容
 * @param {string} props.className - 代码块语言类型
 * @returns 
 */
const CodeBlock = ({ children, className, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const childrenString = String(children).replace(/\n$/, "");

  if (!match) {
    return <code className={styles["inline-code"]} {...props}>{children}</code>;
  }
  return (
    <div className={styles["code-container"]}>
      <Flex justify="space-between" align="center" className={styles["code-header"]}>
        <span>{language}</span>
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
