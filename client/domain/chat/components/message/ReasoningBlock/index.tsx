import { useChatScroll } from "@/domain/chat/hooks/useChatScroll";
import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

interface ReasoningBlockProps {
  reasoning: string;
  /** true = 仍在流式输出（Pending/Streaming），false = 已完成 */
  isStreaming: boolean;
}

/**
 * 思考链展示区
 *
 * 流式阶段默认展开，让用户看到实时思考过程；
 * 正文内容开始到达（isStreaming → false）后自动折叠，
 * 用户可随时点击标题切换展开/折叠状态。
 * 内部使用 useChatScroll 实现流式追底滚动。
 * 
 * @param reasoning - 思考链内容
 * @param isStreaming - 是否正在流式输出
 * @returns
 */
const ReasoningBlock = ({ reasoning, isStreaming }: ReasoningBlockProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const prevIsStreaming = useRef(isStreaming);
  const contentRef = useRef<HTMLDivElement>(null);

  useChatScroll({
    boxRef: contentRef,
    isGenerating: isStreaming,
    threshold: 40,
  });

  useEffect(() => {
    if (prevIsStreaming.current && !isStreaming) {
      setIsExpanded(false);
    }
    prevIsStreaming.current = isStreaming;
  }, [isStreaming]);

  return (
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
      >
        <span className={`${styles.arrow} ${isExpanded ? styles.arrowExpanded : ""}`}>›</span>
        {isStreaming ? (
          <span className={styles.thinkingLabel}>
            思考中
            <span className={styles.dots}>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </span>
        ) : (
          <span className={styles.doneLabel}>已完成思考</span>
        )}
      </button>

      {isExpanded && (
        <div
          ref={contentRef}
          className={styles.content}
        >
          <pre className={styles.text}>{reasoning}</pre>
        </div>
      )}
    </div>
  );
};

export default ReasoningBlock;
