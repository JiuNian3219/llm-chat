import type { ChatFile } from "@/src/types/chat";
import { Flex } from "antd";
import type { CSSProperties } from "react";
import FilePreview from "../../message/FilePreview";
import styles from "./index.module.css";

interface FileQueueProps {
  files: ChatFile[];
  direction?: "left" | "right";
  maxHeight?: boolean;
  close?: boolean;
  onCancel?: (fileId: string, filename: string) => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * 文件队列组件用于展示上传的文件列表
 * @param props - 组件属性
 * @param props.files - 文件列表，包含文件对象
 * @param props.direction - 布局方向，默认为"left"
 * @param props.maxHeight - 是否限制最大高度，默认为true
 * @param props.close - 是否显示关闭按钮，默认为true
 * @param props.className - 组件类名
 * @param props.style - 组件样式
 */
const FileQueue = ({
  files,
  close = true,
  onCancel,
  direction = "left",
  maxHeight = true,
  className,
  style,
}: FileQueueProps) => {
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
      {files.map((file: ChatFile) => (
        <FilePreview
          key={file.id}
          file={file}
          close={close}
          onCancel={onCancel}
        />
      ))}
    </Flex>
  );
};

export default FileQueue;
