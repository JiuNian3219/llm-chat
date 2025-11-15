import { getIconSize } from "@/base/utils";
import { LoadingOutlined } from "@ant-design/icons";
import type { ButtonProps } from "antd";
import { Button } from "antd";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

type IconSize = "minuscule" | "small" | "medium" | "large";

interface IconButtonProps
  extends Omit<
    ButtonProps,
    "shape" | "type" | "onClick" | "className" | "style" | "size"
  > {
  icon: ReactNode;
  type?: "primary" | "default" | "dashed" | "text" | "link";
  size?: IconSize;
  shape?: "circle" | "default" | "round";
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  style?: CSSProperties;
  className?: string;
}

/**
 * 图标按钮组件
 * @param props - 组件属性
 * @param props.icon - 图标
 * @param props.type - 按钮类型
 * @param props.size - 图标大小
 * @param props.shape - 图标类型
 * @param props.loading - 是否加载中
 * @param props.disabled - 禁用状态
 * @param props.onClick - 点击事件
 * @param props.style - 组件样式
 * @param props.className - 组件类名
 * @returns
 */
const IconButton = ({
  icon,
  shape,
  size,
  type,
  loading,
  disabled,
  onClick,
  style,
  className,
  ...props
}: IconButtonProps) => {
  return (
    <Button
      shape={shape || "circle"}
      type={type || "default"}
      style={{
        fontSize: getIconSize(size),
        cursor: loading ? "default" : disabled ? "" : "pointer",
        ...style,
      }}
      disabled={disabled}
      className={className}
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
