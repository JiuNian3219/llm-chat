import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import styles from "./index.module.css";

/** Markdown 表格组件 */
const TableBlock = ({
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) => {
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

/** Markdown 表头组件 */
const TheadBlock = ({
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => {
  return (
    <thead
      className={styles["table-header"]}
      {...props}
    >
      {children}
    </thead>
  );
};

/** Markdown 表体组件 */
const TbodyBlock = ({
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) => {
  return <tbody {...props}>{children}</tbody>;
};

/** Markdown 表格行组件 */
const TrBlock = ({
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => {
  return (
    <tr
      className={styles["table-row"]}
      {...props}
    >
      {children}
    </tr>
  );
};

/** Markdown 表格头单元格组件 */
const ThBlock = ({
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <th
      className={styles["table-header-cell"]}
      {...props}
    >
      {children}
    </th>
  );
};

/** Markdown 表格单元格组件 */
const TdBlock = ({
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) => {
  return (
    <td
      className={styles["table-cell"]}
      {...props}
    >
      {children}
    </td>
  );
};

export { TableBlock, TbodyBlock, TdBlock, ThBlock, TheadBlock, TrBlock };
