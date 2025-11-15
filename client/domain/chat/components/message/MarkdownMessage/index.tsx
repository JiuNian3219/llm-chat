import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import CodeBlock from "../../markdown/CodeBlock";
import HrBlock from "../../markdown/HrBlock";
import LinkBlock from "../../markdown/LinkBlock";
import {
  ListItemBlock,
  OrderedListBlock,
  UnorderedListBlock,
} from "../../markdown/ListBlock";
import PreBlock from "../../markdown/PreBlock";
import {
  TableBlock,
  TbodyBlock,
  TdBlock,
  ThBlock,
  TheadBlock,
  TrBlock,
} from "../../markdown/TableBlock";
import styles from "./index.module.css";
const katexSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "span",
    "math",
    "semantics",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msup",
    "mfrac",
    "msub",
    "msubsup",
    "mover",
    "munder",
    "munderover",
    "mtable",
    "mtr",
    "mtd",
    "mtext",
    "menclose",
    "mspace",
    "msqrt",
  ],
  attributes: {
    ...defaultSchema.attributes,
    span: [
      ...((defaultSchema.attributes && defaultSchema.attributes.span) || []),
      "className",
    ],
    math: [
      ...((defaultSchema.attributes && defaultSchema.attributes.math) || []),
      "display",
    ],
    mi: [
      ...((defaultSchema.attributes && defaultSchema.attributes.mi) || []),
      "mathvariant",
    ],
    mtext: [
      ...((defaultSchema.attributes && defaultSchema.attributes.mtext) || []),
      "mathvariant",
    ],
  },
};

/**
 * 归一化数学公式的分隔符，将 \(\) 转换为 $()$，\\[\\] 转换为 $$$$，保证 KaTeX 渲染正常
 * @param text - Markdown 字符串
 * @returns 归一化后的 Markdown 字符串
 */
const normalizeMathDelimiters = (text: string) => {
  if (!text) return text;
  let t = text
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n\n$$${inner}$$\n\n`);
  return t;
};

interface MarkdownMessageProps {
  message: string;
  isCompleted: boolean;
  className?: string;
}

/**
 * Markdown 消息组件
 * @param props - 组件属性
 * @param props.message - Markdown 字符串
 * @param props.isCompleted - 消息传输是否已完成（影响代码块操作）
 * @param props.className - 自定义类名
 * @returns
 */
const MarkdownMessage = ({
  message,
  isCompleted,
  className,
}: MarkdownMessageProps) => {
  const normalized = normalizeMathDelimiters(message);
  return (
    <div className={`${styles["markdown-container"]} ${className}`}>
      <ReactMarkdown
        // remarkMath用于解析数学公式
        // remarkGfm用于解析GitHub Flavored Markdown
        // remarkToc用于解析目录
        remarkPlugins={[
          [remarkMath, { singleDollar: true }],
          remarkGfm,
          remarkToc,
        ]}
        // rehypeKatex用于渲染数学公式；rehypeSanitize用于安全过滤（允许 KaTeX 标签）
        rehypePlugins={[
          [rehypeKatex, { strict: false, throwOnError: false }],
          [rehypeSanitize, katexSanitizeSchema],
        ]}
        // 自定义的Markdown组件
        components={{
          pre: ({ children }) => <PreBlock>{children}</PreBlock>,
          code: ({ children, className, ...props }: any) => (
            <CodeBlock
              isCompleted={isCompleted}
              className={className}
              {...props}
            >
              {children}
            </CodeBlock>
          ),
          a: ({ children, ...props }: any) => (
            <LinkBlock {...props}>{children}</LinkBlock>
          ),
          hr: () => <HrBlock />,
          table: ({ children, ...props }: any) => (
            <TableBlock {...props}>{children}</TableBlock>
          ),
          thead: ({ children, ...props }: any) => (
            <TheadBlock {...props}>{children}</TheadBlock>
          ),
          tbody: ({ children, ...props }: any) => (
            <TbodyBlock {...props}>{children}</TbodyBlock>
          ),
          tr: ({ children, ...props }: any) => (
            <TrBlock {...props}>{children}</TrBlock>
          ),
          th: ({ children, ...props }: any) => (
            <ThBlock {...props}>{children}</ThBlock>
          ),
          td: ({ children, ...props }: any) => (
            <TdBlock {...props}>{children}</TdBlock>
          ),
          li: ({ children, ...props }: any) => (
            <ListItemBlock {...props}>{children}</ListItemBlock>
          ),
          ol: ({ children, ...props }: any) => (
            <OrderedListBlock {...props}>{children}</OrderedListBlock>
          ),
          ul: ({ children, ...props }: any) => (
            <UnorderedListBlock {...props}>{children}</UnorderedListBlock>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
