import { ExportOutlined } from "@ant-design/icons";
import type { AnchorHTMLAttributes } from "react";
import styles from "./index.module.css";

/** Markdown 链接组件 */
const LinkBlock = ({
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
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
