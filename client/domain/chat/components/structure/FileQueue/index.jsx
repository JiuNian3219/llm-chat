import { Flex } from "antd";
import FilePreview from "../../message/FilePreview";
import styles from "./index.module.css";

/**
 * 文件队列组件用于展示上传的文件列表
 * @param {Object} props - 组件属性
 * @param {Array} props.files - 文件列表，包含文件对象
 * @param {"left" | "right"} [props.direction] - 布局方向，默认为"left"
 * @param {boolean} [props.maxHeight] - 是否限制最大高度，默认为true
 * @param {boolean} [props.close] - 是否显示关闭按钮，默认为true
 * @param {string} [props.className] - 组件类名
 * @param {import("react").CSSProperties} [props.style] - 组件样式
 */
const FileQueue = ({
  files,
  close = true,
  direction = "left",
  maxHeight = true,
  className,
  style,
}) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <Flex
      wrap
      align="center"
      justify={direction === "left" ? "flex-start" : "flex-end"}
      gap={8}
      className={`${styles["file-queue-box"]} ${className || ""}`}
      style={{
        maxHeight: maxHeight ? "200px" : "none",
        ...style,
      }}
    >
      {files.map((file) => (
        <FilePreview
          key={file.id}
          file={file}
          close={close}
        />
      ))}
    </Flex>
  );
};

export default FileQueue;
