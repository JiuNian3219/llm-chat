import IconButton from "@/base/components/IconButton";
import { formatFileSize, getFormattedFileType } from "@/domain/chat/utils";
import fileIcon from "@/src/assets/file.svg";
import ImageFailedIcon from "@/src/assets/image-failed.svg";
import imageIcon from "@/src/assets/image.svg";
import type { ChatFile } from "@/src/types/chat";
import { CloseOutlined } from "@ant-design/icons";
import { Flex, Image, Spin, Tooltip } from "antd";
import type { MouseEvent } from "react";
import { useState } from "react";
import styles from "./index.module.css";

interface FilePreviewProps {
  file: ChatFile;
  close?: boolean;
  onCancel?: (fileId: string, filename: string) => void;
}

/**
 * 文件预览组件，用于展示文件信息和预览图片文件
 * @param props
 * @param props.file - 文件对象，包含name, type, size等属性
 * @param props.close - 是否显示关闭按钮，默认为true
 * @param props.onCancel - 取消/移除文件的回调
 */
const FilePreview = ({ file, close = true, onCancel }: FilePreviewProps) => {
  const [imageVisible, setImageVisible] = useState(false);
  const { id, name, size, type, url, status } = file;
  const isImage = type === "image";

  const handleImageClick = (value: boolean) => {
    if (type === "image") {
      setImageVisible(value);
    }
  };

  const handleOpenImage = () => {
    if (type === "image") {
      setImageVisible(true);
    }
  };

  const handleCancelUpload = (e: MouseEvent) => {
    e.stopPropagation();
    onCancel?.(id, name);
  };

  return (
    <Flex
      align="center"
      justify="flex-start"
      gap={8}
      className={`${styles["file-preview-box"]} ${isImage ? styles["file-image-box"] : ""}`}
      onClick={handleOpenImage}
    >
      {status === "done" ? (
        <img
          src={isImage ? imageIcon : fileIcon}
          width={32}
          height={32}
        />
      ) : (
        <Spin style={{ width: 32 }} />
      )}
      <Flex vertical>
        <Tooltip title={name}>
          <span className={styles["file-title"]}>{name}</span>
        </Tooltip>
        {isImage && (
          <Image
            src={url}
            // 使用className设置display为none会出现问题
            style={{ display: "none" }}
            fallback={ImageFailedIcon}
            preview={{
              visible: imageVisible,
              onVisibleChange: handleImageClick,
            }}
          />
        )}
        <Flex
          gap={4}
          className={styles["file-info-box"]}
        >
          <span>{getFormattedFileType(name)}</span>
          <span>{formatFileSize(size)}</span>
        </Flex>
      </Flex>
      {close && (
        <IconButton
          icon={<CloseOutlined />}
          size="minuscule"
          className={styles["close-button"]}
          onClick={handleCancelUpload}
        />
      )}
    </Flex>
  );
};

export default FilePreview;
