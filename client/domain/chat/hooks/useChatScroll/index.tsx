import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseChatScrollOptions {
  boxRef: RefObject<HTMLElement | null>;
  isGenerating?: boolean;
  threshold?: number;
}

/**
 * 聊天窗口自动滚动 Hook
 *
 * 追底策略：
 * - 内容变化时若"接近底部"（距底 ≤ threshold）→ 自动追底
 * - 用户向上滚动时暂停追底（isWheelingUp 窗口期内）
 * - 用户向下滚动时立即恢复追底，无需等待靠近底部（isWheelingDown 窗口期内）
 *   适用于小容器（如 ReasoningBlock）内容持续增长导致永远无法"靠近底部"的场景
 *
 * @param options.boxRef      - 滚动容器 ref
 * @param options.isGenerating - 是否正在生成内容
 * @param options.threshold   - 距底部多少像素内视为"接近底部"（默认 200）
 */
export const useChatScroll = ({
  boxRef,
  isGenerating = false,
  threshold = 200,
}: UseChatScrollOptions) => {
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);

  /**
   * 检查是否远离底部
   */
  const checkIsAwayFromBottom = useCallback(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const isAwayFromBottom =
      scrollHeight - scrollTop - clientHeight > threshold;
    setIsAwayFromBottom(isAwayFromBottom);
    return isAwayFromBottom;
  }, [boxRef, threshold]);

  /**
   * 滚动到容器底部
   * @param smooth - 是否平滑滚动
   */
  const scrollToBottom = useCallback(
    (smooth: boolean = true) => {
      const scrollElement = boxRef.current;
      if (!scrollElement) return;

      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
      checkIsAwayFromBottom();
    },
    [boxRef, checkIsAwayFromBottom]
  );

  // 向上滚动：暂停追底；向下滚动：立即恢复追底
  const [isWheelingUp, setIsWheelingUp] = useState(false);
  const [isWheelingDown, setIsWheelingDown] = useState(false);
  const wheelUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelDownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        // 向上滚动：暂停追底，同时清除"向下"状态
        setIsWheelingUp(true);
        setIsWheelingDown(false);
        if (wheelDownTimer.current) clearTimeout(wheelDownTimer.current);
        if (wheelUpTimer.current) clearTimeout(wheelUpTimer.current);
        wheelUpTimer.current = setTimeout(() => setIsWheelingUp(false), 300);
      } else if (e.deltaY > 0) {
        // 向下滚动：立即清除"向上"状态，进入"向下"窗口期
        setIsWheelingUp(false);
        setIsWheelingDown(true);
        if (wheelUpTimer.current) clearTimeout(wheelUpTimer.current);
        if (wheelDownTimer.current) clearTimeout(wheelDownTimer.current);
        wheelDownTimer.current = setTimeout(() => setIsWheelingDown(false), 300);
      }
    };

    scrollElement.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      scrollElement.removeEventListener("wheel", handleWheel);
      if (wheelUpTimer.current) clearTimeout(wheelUpTimer.current);
      if (wheelDownTimer.current) clearTimeout(wheelDownTimer.current);
    };
  }, [boxRef]);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const observer = new MutationObserver(() => {
      // 追底条件（满足其一即可）：
      //   1. 接近底部（标准场景）
      //   2. 用户正在向下滚动（小容器流式增长场景，距底可能超过 threshold 但用户意图明确）
      const nearBottom = !checkIsAwayFromBottom();
      if (isGenerating && !isWheelingUp && (nearBottom || isWheelingDown)) {
        scrollToBottom();
      }
      checkIsAwayFromBottom();
    });

    // 监听文本和子元素变化
    observer.observe(scrollElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [
    boxRef,
    isGenerating,
    scrollToBottom,
    checkIsAwayFromBottom,
    isWheelingUp,
    isWheelingDown,
  ]);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    checkIsAwayFromBottom();

    scrollElement.addEventListener("scroll", checkIsAwayFromBottom, {
      passive: true,
    });

    return () => {
      scrollElement.removeEventListener("scroll", checkIsAwayFromBottom);
    };
  }, [boxRef, checkIsAwayFromBottom]);

  return {
    isAwayFromBottom,
    scrollToBottom,
  };
};
