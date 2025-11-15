import IconButton from "@/base/components/IconButton";
import useIsMobile from "@/base/hooks/useIsMobile";
import { useConversation } from "@/domain/chat/stores/conversationStore";
import { useAppStore } from "@/src/stores/appStore";
import { MenuOutlined } from "@ant-design/icons";
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
  const isMobile = useIsMobile();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <Header
      style={style}
      className={`${styles["header"]} ${className || ""}`}
    >
      {isMobile && (
        <IconButton
          type="text"
          icon={<MenuOutlined />}
          onClick={() => toggleSidebar()}
        />
      )}
      <Title
        level={4}
        className={styles["header-title"]}
      >
        {isLoadingTitle ? <Skeleton.Input active /> : currentTitle || ""}
      </Title>
      {/** 移动端下， 让 title 组件处于居中位置 */}
      {isMobile && <div></div>}
    </Header>
  );
};

export default HeaderCard;
