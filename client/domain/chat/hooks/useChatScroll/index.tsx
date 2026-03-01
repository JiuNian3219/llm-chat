import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseChatScrollOptions {
  boxRef: RefObject<HTMLElement | null>;
  isGenerating?: boolean;
  threshold?: number;
}

/**
 * 聊天窗口自动滚动 Hook
 * @param options - 配置项
 * @param options.boxRef - 需要绑定到滚动容器的 ref
 * @param options.isGenerating - 是否正在生成（用于判断是否需要自动滚动）
 * @param options.threshold - 距离底部多少像素内自动滚动
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

  // 鼠标滚轮向上滚动状态
  const [isWheelingUp, setIsWheelingUp] = useState(false);
  const wheelTimer = useRef<any>(null);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        setIsWheelingUp(true);
        if (wheelTimer.current) clearTimeout(wheelTimer.current);
        wheelTimer.current = setTimeout(() => {
          setIsWheelingUp(false);
        }, 300);
      }
    };

    scrollElement.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      scrollElement.removeEventListener("wheel", handleWheel);
      if (wheelTimer.current) clearTimeout(wheelTimer.current);
    };
  }, [boxRef]);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const observer = new MutationObserver(() => {
      // 如果接近底部且正在生成且鼠标滚轮未滚动，则滚动到底部
      if (!checkIsAwayFromBottom() && isGenerating && !isWheelingUp) {
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
