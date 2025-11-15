import IconButton from "@/base/components/IconButton";
import { UPLOAD_LIMITS } from "@/domain/chat/const";
import { uploadFiles } from "@/domain/chat/services/chatService";
import { PaperClipOutlined } from "@ant-design/icons";
import type { CSSProperties, ChangeEvent } from "react";
import { useRef } from "react";
import styles from "./index.module.css";

interface FileUploadButtonProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * 文件上传按钮
 * @param props - 组件属性
 * @param props.className - 组件类名
 * @param props.style - 组件样式
 * @returns
 */
const FileUploadButton = ({
  className,
  style,
  ...props
}: FileUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(Array.from(files));
    }
    e.target.value = "";
  };

  return (
    <>
      <IconButton
        icon={<PaperClipOutlined />}
        onClick={handleClick}
        className={className}
        style={style}
        {...props}
      ></IconButton>
      <input
        type="file"
        className={styles.hidden}
        ref={fileInputRef}
        multiple={true}
        accept={UPLOAD_LIMITS.allowedTypes.join(",")}
        onChange={handleFileChange}
      />
    </>
  );
};

export default FileUploadButton;
