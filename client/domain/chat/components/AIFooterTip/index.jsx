import styles from "./index.module.css";

/**
 * 足部提示组件
 * @param {object} props - 组件属性
 * @param {string} [props.children] - 子组件
 * @param {import("react").CSSProperties} [props.style] - 组件样式
 * @param {string} [props.className] - 组件类名
 * @returns
 */
const AIFooterTip = ({ children, style, className }) => {
  return (
    <div
      className={`${styles["footer-style"]} ${className || ""}`}
      style={style}
    >
      {children || "LLM Chat 也可能会犯错，请核查重要信息。"}
    </div>
  );
};

export default AIFooterTip;
