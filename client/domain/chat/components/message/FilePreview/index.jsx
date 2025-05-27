import { formatFileSize, getFormattedFileType } from "@/domain/chat/utils";
import fileIcon from "@/src/assets/file.svg";
import imageIcon from "@/src/assets/image.svg";
import { Flex, Image } from "antd";
import styles from "./index.module.css";
import IconButton from "@/base/components/IconButton";
import { CloseOutlined } from "@ant-design/icons";
import { useState } from "react";

/**
 * 文件预览组件，用于展示文件信息和预览图片文件
 * @param {object} props
 * @param {object} [props.file] - 文件对象，包含name, type, size等属性
 */
const FilePreview = ({ file }) => {
  const [imageVisible, setImageVisible] = useState(false);
  const { name, size, type, url } = file;
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

  return (
    <Flex
      align="center"
      justify="flex-start"
      gap={8}
      className={`${styles["file-preview-box"]} ${isImage ? styles["file-image-box"] : ""}`}
      onClick={handleOpenImage}
    >
      <img
        src={isImage ? imageIcon : fileIcon}
        width={32}
        height={32}
      ></img>
      <Flex vertical>
        <span className={styles["file-title"]}>{name}</span>
        {isImage && (
          <Image
            className={styles["file-image"]}
            src={url}
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
      <IconButton
        icon={<CloseOutlined />}
        size="minuscule"
        className={styles["close-button"]}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
    </Flex>
  );
};

export default FilePreview;
