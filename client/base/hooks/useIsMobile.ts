import { useEffect, useState } from "react";

/**
 * 判断是否为移动端
 * @param breakpoint 移动端断点，默认768px
 * @returns
 */
export default function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mq.addEventListener?.("change", handleChange);
    return () => {
      mq.removeEventListener?.("change", handleChange);
    };
  }, [breakpoint]);

  return isMobile;
}
