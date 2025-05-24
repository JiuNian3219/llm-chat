import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import PreBlock from "../../markdown/PreBlock";
import LinkBlock from "../../markdown/LinkBlock";
import CodeBlock from "../../markdown/CodeBlock";
import HrBlock from "../../markdown/HrBlock";
import {
  TableBlock,
  TheadBlock,
  TbodyBlock,
  TrBlock,
  ThBlock,
  TdBlock,
} from "../../markdown/TableBlock";
import {
  ListItemBlock,
  OrderedListBlock,
  UnorderedListBlock,
} from "../../markdown/ListBlock";
import styles from "./index.module.css";
/**
 * Markdown消息组件，展示Markdown格式的消息内容
 * @param {object} props - 组件属性
 * @param {string} props.message - Markdown消息内容
 * @param {string} [props.className] - 组件类名
 * @returns 
 */
const MarkdownMessage = ({ message, className }) => {
  return (
    <div className={`${styles["markdown-container"]} ${className}`}>
      <ReactMarkdown
        // remarkGfm用于解析GitHub Flavored Markdown
        // remarkMath用于解析数学公式
        // remarkToc用于解析目录
        remarkPlugins={[remarkGfm, remarkMath, remarkToc]}
        // rehypeSanitize用于解析HTML
        rehypePlugins={[rehypeSanitize]}
        // 自定义的Markdown组件
        components={{
          pre: ({ children }) => <PreBlock>{children}</PreBlock>,
          code: ({ children, className, ...props }) => (
            <CodeBlock
              className={className}
              {...props}
            >
              {children}
            </CodeBlock>
          ),
          a: ({ children, ...props }) => (
            <LinkBlock {...props}>{children}</LinkBlock>
          ),
          hr: ({}) => <HrBlock />,
          table: ({ children, ...props }) => (
            <TableBlock {...props}>{children}</TableBlock>
          ),
          thead: ({ children, ...props }) => (
            <TheadBlock {...props}>{children}</TheadBlock>
          ),
          tbody: ({ children, ...props }) => (
            <TbodyBlock {...props}>{children}</TbodyBlock>
          ),
          tr: ({ children, ...props }) => (
            <TrBlock {...props}>{children}</TrBlock>
          ),
          th: ({ children, ...props }) => (
            <ThBlock {...props}>{children}</ThBlock>
          ),
          td: ({ children, ...props }) => (
            <TdBlock {...props}>{children}</TdBlock>
          ),
          li: ({ children, ...props }) => (
            <ListItemBlock {...props}>{children}</ListItemBlock>
          ),
          ol: ({ children, ...props }) => (
            <OrderedListBlock {...props}>{children}</OrderedListBlock>
          ),
          ul: ({ children, ...props }) => (
            <UnorderedListBlock {...props}>{children}</UnorderedListBlock>
          ),
        }}
      >
        {message}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
