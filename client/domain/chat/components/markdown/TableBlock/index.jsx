import styles from "./index.module.css";

/**
 * Markdown 表格组件
 * @param {object} props
 * @param {import("react").ReactNode} props.children - 表格内容
 * @returns
 */
const TableBlock = ({ children, ...props }) => {
  return (
    <div className={styles["table-container"]}>
      <table
        className={styles["markdown-table"]}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

/**
 * Markdown 表头组件
 * @param {object} props
 * @param {import("react").ReactNode} props.children - 表头内容
 * @returns
 */
const TheadBlock = ({ children, ...props }) => {
  return (
    <thead
      className={styles["table-header"]}
      {...props}
    >
      {children}
    </thead>
  );
};

/**
 * Markdown 表体组件
 * @param {object} props
 * @param {import("react").ReactNode} props.children - 表体内容
 * @returns
 */
const TbodyBlock = ({ children, ...props }) => {
  return <tbody {...props}>{children}</tbody>;
};

/**
 * Markdown 表格行组件
 * @param {object} props
 * @param {import("react").ReactNode} props.children - 表格行内容
 * @returns
 */
const TrBlock = ({ children, ...props }) => {
  return (
    <tr
      className={styles["table-row"]}
      {...props}
    >
      {children}
    </tr>
  );
};

/**
 * Markdown 表格头单元格组件
 * @param {object} props
 * @returns
 */
const ThBlock = ({ children, ...props }) => {
  return (
    <th
      className={styles["table-header-cell"]}
      {...props}
    >
      {children}
    </th>
  );
};

/**
 * Markdown 表格单元格组件
 * @param {object} props
 * @returns
 */
const TdBlock = ({ children, ...props }) => {
  return (
    <td
      className={styles["table-cell"]}
      {...props}
    >
      {children}
    </td>
  );
};

export { TableBlock, TheadBlock, TbodyBlock, TrBlock, ThBlock, TdBlock };
