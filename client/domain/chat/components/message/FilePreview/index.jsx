import { formatFileSize, getFormattedFileType } from "@/domain/chat/utils";
import fileIcon from "@/src/assets/file.svg";
import imageIcon from "@/src/assets/image.svg";
import { Flex, Image, Skeleton, Spin, Tooltip } from "antd";
import styles from "./index.module.css";
import IconButton from "@/base/components/IconButton";
import { CloseOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";

/**
 * 文件预览组件，用于展示文件信息和预览图片文件
 * @param {object} props
 * @param {object} [props.file] - 文件对象，包含name, type, size等属性
 * @param {boolean} [props.close] - 是否显示关闭按钮，默认为true
 */
const FilePreview = ({ file, close = true }) => {
  const [imageVisible, setImageVisible] = useState(false);
  const { handleCancelFileUpload } = useChatContext();
  const { id, name, size, type, url, status } = file;
  const isImage = type === "image";

  /**
   * 处理图片点击事件，控制图片预览的显示和隐藏
   * @param {boolean} value
   */
  const handleImageClick = (value) => {
    if (type === "image") {
      setImageVisible(value);
    }
  };

  /**
   * 处理打开图片的事件
   */
  const handleOpenImage = () => {
    if (type === "image") {
      setImageVisible(true);
    }
  };

  /**
   * 取消上传文件
   */
  const handleCancelUpload = (e) => {
    e.stopPropagation();
    handleCancelFileUpload(id, name);
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
        <Spin
          style={{
            width: 32,
          }}
        />
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
