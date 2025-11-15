import { useConversation } from "@/domain/chat/stores/conversationStore";
import { Layout, Skeleton, Typography } from "antd";
import type { CSSProperties } from "react";
import styles from "./index.module.css";

const { Title } = Typography;
const { Header } = Layout;

interface HeaderCardProps {
  style?: CSSProperties;
  className?: string;
}

/**
 * HeaderCard 组件，用于显示页面头部信息
 * @param props - 组件属性
 * @param props.style - 额外的样式
 * @param props.className - 额外的类名
 */
const HeaderCard = ({ style, className }: HeaderCardProps) => {
  const currentTitle = useConversation((s) => s.currentTitle);
  const isLoadingTitle = useConversation((s) => s.isLoadingTitle);

  return (
    <Header
      style={style}
      className={`${styles["header"]} ${className || ""}`}
    >
      <Title
        level={4}
        className={styles["header-title"]}
      >
        {isLoadingTitle ? <Skeleton.Input active /> : currentTitle || ""}
      </Title>
    </Header>
  );
};

export default HeaderCard;
