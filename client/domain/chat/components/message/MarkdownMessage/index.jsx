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
 * @param {string} text 
 * @returns 
 */
const normalizeMathDelimiters = (text) => {
  if (!text) return text;
  let t = text
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner) => `$${inner}$`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n\n$$${inner}$$\n\n`);
  return t;
};

/**
 * Markdown消息组件，展示Markdown格式的消息内容
 * @param {object} props - 组件属性
 * @param {string} props.message - Markdown消息内容
 * @param {boolean} props.isCompleted - 内容是否完成
 * @param {string} [props.className] - 组件类名
 * @returns 
 */
const MarkdownMessage = ({ message, isCompleted, className }) => {
  const normalized = normalizeMathDelimiters(message);
  return (
    <div className={`${styles["markdown-container"]} ${className}`}>
      <ReactMarkdown
        // remarkMath用于解析数学公式
        // remarkGfm用于解析GitHub Flavored Markdown
        // remarkToc用于解析目录
        remarkPlugins={[[remarkMath, { singleDollar: true }], remarkGfm, remarkToc]}
        // rehypeKatex用于渲染数学公式；rehypeSanitize用于安全过滤（允许 KaTeX 标签）
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }], [rehypeSanitize, katexSanitizeSchema]]}
        // 自定义的Markdown组件
        components={{
          pre: ({ children }) => <PreBlock>{children}</PreBlock>,
          code: ({ children, className, ...props }) => (
            <CodeBlock
              isCompleted={isCompleted}
              className={className}
              {...props}
            >
              {children}
            </CodeBlock>
          ),
          a: ({ children, ...props }) => (
            <LinkBlock {...props}>{children}</LinkBlock>
          ),
          hr: ({ }) => <HrBlock />,
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
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
