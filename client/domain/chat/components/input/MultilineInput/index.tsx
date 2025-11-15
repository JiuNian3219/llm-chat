import TextArea from "antd/es/input/TextArea";
import type { CSSProperties, ChangeEvent } from "react";
import styles from "./index.module.css";

interface MultilineInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  minRows?: number;
  maxRows?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * 多行输入框
 * @param props - 组件属性
 * @param props.placeholder - 提示文本
 * @param props.value - 输入框值
 * @param props.onChange - 输入框值变化回调
 * @param props.minRows - 最小行数
 * @param props.maxRows - 最大行数
 * @param props.className - 组件类名
 * @param props.style - 组件样式
 * @returns
 */
const MultilineInput = ({
  placeholder,
  minRows = 2,
  maxRows = 8,
  value,
  onChange,
  className,
  style,
}: MultilineInputProps) => {
  /** 输入框是否为受控组件 */
  const isControlled = value !== undefined && onChange !== undefined;

  /** 处理输入框值变化 */
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (isControlled) {
      onChange && onChange(e.target.value);
    }
  };
  return (
    <TextArea
      value={value}
      onChange={handleChange}
      placeholder={placeholder || ""}
      autoSize={{ minRows, maxRows }}
      className={`${styles["multiline-input"]} ${className}`}
      style={style}
    ></TextArea>
  );
};

export default MultilineInput;
