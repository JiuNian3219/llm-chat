import { Button } from "antd";
import styles from "./index.module.css";

/**
 * FollowUpMessage 组件
 * @param {object} props - 组件属性
 * @param {string} props.message - 展示信息
 * @param {string} [props.className] - 额外的类名
 * @param {React.CSSProperties} [props.style] - 额外的样式
 * @returns
 */
const FollowUpMessage = ({ message, className, style }) => {
  return (
    <Button
      className={`${styles.follow} ${className}`}
      style={style}
    >
      {message}
    </Button>
  );
};

export default FollowUpMessage;
