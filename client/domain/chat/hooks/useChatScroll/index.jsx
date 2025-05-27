import { useEffect, useState, useCallback } from "react";

/**
 * 聊天窗口自动滚动 Hook
 * @param {Object} options - 配置项
 * @param {React.RefObject} options.boxRef - 需要绑定到滚动容器的 ref
 * @param {boolean} [options.isChatCompleted=true] - 是否聊天已完成
 * @param {number} [options.threshold=300] - 距离底部多少像素内自动滚动
 */
export const useChatScroll = ({ boxRef, isChatCompleted = false, threshold = 300 }) => {
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);


  /**
   * 检查是否远离底部
   */
  const checkIsAwayFromBottom = useCallback(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const isAwayFromBottom = scrollHeight - scrollTop - clientHeight > threshold;
    setIsAwayFromBottom(isAwayFromBottom);
    return isAwayFromBottom;
  }, [boxRef, threshold]);

  /**
   * 滚动到容器底部
   * @param {boolean} [smooth=true] - 是否平滑滚动
   */
  const scrollToBottom = useCallback((smooth=true) => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    scrollElement.scrollTo({
      top: scrollElement.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    checkIsAwayFromBottom();
  }, [boxRef]);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    const observer = new MutationObserver(() => {
      // 如果接近底部且聊天未完成，则滚动到底部
      if (!checkIsAwayFromBottom() && !isChatCompleted) {
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
  }, [boxRef, isChatCompleted, scrollToBottom, checkIsAwayFromBottom]);

  useEffect(() => {
    const scrollElement = boxRef.current;
    if (!scrollElement) return;

    checkIsAwayFromBottom();
    
    scrollElement.addEventListener("scroll", checkIsAwayFromBottom, { passive: true });
    
    return () => {
      scrollElement.removeEventListener("scroll", checkIsAwayFromBottom);
    };
  }, [boxRef, checkIsAwayFromBottom]);

  return {
    isAwayFromBottom,
    scrollToBottom,
  };
};