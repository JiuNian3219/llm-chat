import { Button } from "antd";
import { getIconSize } from "@/base/utils";
import { LoadingOutlined } from "@ant-design/icons";


/**
 *
 * @param {object} props - 组件属性
 * @param {import("react").ReactNode} props.icon - 图标
 * @param {"primary" | "default" | "dashed" | "text" | "link"} [props.type] - 按钮类型
 * @param {"small" | "medium" | "large"} [props.size] - 图标大小
 * @param {"circle" | "default" | "round"} [props.shape] - 图标类型
 * @param {boolean} [props.loading] - 是否加载中
 * @param {import("react").MouseEventHandler} [props.onClick] - 点击事件
 * @param {any} [props.rest] - 其他属性
 * @returns
 */
const IconButton = ({ icon, shape, size, type, loading, onClick, ...props }) => {
  return (
    <Button
      shape={shape ||"circle"}
      type={type || "default"}
      style={{
        fontSize: getIconSize(size),
        opacity: loading ? 0.5 : 1,
        cursor: loading ? "default" : "pointer",
      }}
  
      onClick={(e) => {
        // 如果正在加载，则阻止点击事件
        if (loading) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick && onClick(e);
      }}
      {...props}
    >
      {loading ? <LoadingOutlined /> : icon}
    </Button>
  );
};

export default IconButton;