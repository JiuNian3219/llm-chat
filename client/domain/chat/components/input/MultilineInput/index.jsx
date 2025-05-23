import TextArea from "antd/es/input/TextArea";
import styles from "./index.module.css";

/**
 * 多行输入框组件
 * @param {object} props - 组件属性
 * @param {string} [props.placeholder] - 输入框提示
 * @param {string} [props.value] - 输入框值
 * @param {function} [props.onChange] - 输入框值变化时的回调函数
 * @param {number} [props.minRows=2] - 最小行数
 * @param {number} [props.maxRows=8] - 最大行数
 * @param {string} [props.className] - 组件类名
 * @param {import("react").CSSProperties} [props.style] - 组件样式
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
}) => {
  /**
   * 判断是否为受控组件
   */
  const isControlled = value !== undefined && onChange !== undefined;

  /**
   * 处理输入框值变化
   * @param {object} e - 事件对象
   */
  const handleChange = (e) => {
    if (isControlled) {
      onChange(e.target.value);
    }
  }
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
