import SyntaxHighlighter from "react-syntax-highlighter";
import styles from "./index.module.css";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Flex } from "antd";

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
    return <code className={styles["inline-code"]} {...props}>{childrenString}</code>;
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
        }}
        style={atomOneLight}
        language={language}
        {...props}
      >
        {childrenString}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
