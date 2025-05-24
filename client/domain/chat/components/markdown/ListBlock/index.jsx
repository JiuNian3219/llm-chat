import styles from "./index.module.css";

/**
 * Markdown 有序列表组件
 * @param {object} props - 组件属性
 * @param {import("react").ReactNode} props.children - 组件子元素
 * @returns
 */
const OrderedListBlock = ({ children, ...props }) => {
  return (
    <ol className={styles["ordered-list"]} {...props}>
      {children}
    </ol>
  );
};

/**
 * Markdown 无序列表组件
 * @param {object} props - 组件属性
 * @param {import("react").ReactNode} props.children - 组件子元素
 * @returns
 */
const UnorderedListBlock = ({ children, ...props }) => {
  return (
    <ul className={styles["unordered-list"]} {...props}>
      {children}
    </ul>
  );
};

/**
 * Markdown 列表项组件
 * @param {object} props - 组件属性
 * @param {import("react").ReactNode} props.children - 组件子元素
 */
const ListItemBlock = ({ children, ...props }) => {
  return (
    <li className={styles["list-item"]} {...props}>
      {children}
    </li>
  );
};

export { OrderedListBlock, UnorderedListBlock, ListItemBlock };