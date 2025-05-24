import { CheckOutlined, CloseOutlined, CopyOutlined } from "@ant-design/icons";
import { useState } from "react";
import styles from "./index.module.css";
import { App } from "antd";

/**
 * @param {object} options - Hook选项
 * @param {number} [options.resetDelay=1000] - 复制状态重置延迟，单位为毫秒，默认值为1000
 * @param {boolean} [options.useAntMessage=true] - 是否使用Ant Design的消息提示，默认值为true
 * @returns
 */
const useCopyToClipboard = (option = {}) => {
  const { resetDelay = 1000, useAntMessage = true } = option;
  // 复制状态，null表示未复制，'success'表示复制成功，'error'表示复制失败
  const [copyStatus, setCopyStatus] = useState(null);
  const { message } = App.useApp();

  /**
   * 获取复制图标，根据复制状态返回不同的图标
   */
  const getCopyIcon = () => {
    if (copyStatus === "success") {
      return <CheckOutlined className={styles["copy-success-icon"]} />;
    } else if (copyStatus === "error") {
      return <CloseOutlined className={styles["copy-error-icon"]} />;
    } else {
      return <CopyOutlined className={styles["copy-icon"]} />;
    }
  };

  /**
   * 复制文本到剪贴板
   * @param {string} text - 要复制的文本
   */
  const copyText = async (text) => {
    // 如果没有文本或者复制状态不为null，则不执行复制操作
    if (!text || copyStatus != null) return;

    await navigator.clipboard
      .writeText(text)
      .then(() => {
        if (useAntMessage) {
          message.success("复制成功");
        }
        setCopyStatus("success");
      })
      .catch(() => {
        if (useAntMessage) {
          message.error("复制失败");
        }
        setCopyStatus("error");
      });

    // 设置定时器，resetDelay毫秒后清除复制状态
    setTimeout(() => {
      setCopyStatus(null);
    }, resetDelay);
  };

  // 复制消息到剪贴板
  return { copyStatus, getCopyIcon, copyText };
};

export default useCopyToClipboard;
