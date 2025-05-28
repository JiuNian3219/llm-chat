import IconButton from "@/base/components/IconButton";
import { useChatContext } from "@/domain/chat/contexts/useChatContext";
import { PaperClipOutlined } from "@ant-design/icons";
import { useRef } from "react";
import styles from "./index.module.css";
import { UPLOAD_LIMITS } from "@/domain/chat/const";

/**
 * 文件上传按钮组件
 * @param {object} props - 组件属性
 * @param {string} [props.className] - 组件类名
 * @param {import("react").CSSProperties} [props.style] - 组件样式
 * @returns
 */
const FileUploadButton = ({ className, style, ...props }) => {
  const fileInputRef = useRef(null);
  const { handleUploadFile } = useChatContext();
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * 处理文件选择变化事件
   * @param {object} e - 事件对象 
   */
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(Array.from(files));
    }
    e.target.value = ''
  }
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
