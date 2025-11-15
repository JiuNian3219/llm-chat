import styles from "./index.module.css";
import type { HTMLAttributes, LiHTMLAttributes } from "react";

/** Markdown 有序列表组件 */
const OrderedListBlock = ({ children, ...props }: HTMLAttributes<HTMLOListElement>) => {
  return (
    <ol className={styles["ordered-list"]} {...props}>
      {children}
    </ol>
  );
};

/** Markdown 无序列表组件 */
const UnorderedListBlock = ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => {
  return (
    <ul className={styles["unordered-list"]} {...props}>
      {children}
    </ul>
  );
};

/** Markdown 列表项组件 */
const ListItemBlock = ({ children, ...props }: LiHTMLAttributes<HTMLLIElement>) => {
  return (
    <li className={styles["list-item"]} {...props}>
      {children}
    </li>
  );
};

export { OrderedListBlock, UnorderedListBlock, ListItemBlock };