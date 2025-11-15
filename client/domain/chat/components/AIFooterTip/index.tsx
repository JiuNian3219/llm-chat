import type { CSSProperties, ReactNode } from "react";
import styles from "./index.module.css";

interface AIFooterTipProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/**
 * 足部提示组件
 * @param props - 组件属性
 * @param props.children - 子组件
 * @param props.style - 组件样式
 * @param props.className - 组件类名
 * @returns
 */
const AIFooterTip = ({ children, style, className }: AIFooterTipProps) => {
  return (
    <div
      className={`${styles["footer"]} ${className || ""}`}
      style={style}
    >
      {children || "LLM Chat 也可能会犯错，请核查重要信息。"}
    </div>
  );
};

export default AIFooterTip;
