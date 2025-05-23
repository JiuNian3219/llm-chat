import { ExportOutlined } from "@ant-design/icons";
import styles from "./index.module.css";

/**
 * Markdown 链接组件
 * @param {object} props - 组件属性
 * @param {import("react").ReactNode} props.children - 组件子元素
 * @returns
 */
const LinkBlock = ({ children, ...props }) => {
  return (
    <a
      className={styles.link}
      target="_blank"
      {...props}
    >
      {children}
      <ExportOutlined className={styles["link-icon"]} />
    </a>
  );
};

export default LinkBlock;
