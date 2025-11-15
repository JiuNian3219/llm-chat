import { Flex, Layout } from "antd";
import type { CSSProperties } from "react";
import { useState } from "react";
import SidebarContent from "./components/SidebarContent";
import SidebarHeader from "./components/SidebarHeader";
import styles from "./index.module.css";

const { Sider } = Layout;

interface SidebarProps {
  style?: CSSProperties;
  className?: string;
}
/**
 * 侧边栏组件，包含头部和内容部分
 * @param props - 组件属性
 * @param props.style - 额外的样式
 * @param props.className - 额外的类名
 * @returns
 */
const Sidebar = ({ style, className }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sider
      width="300px"
      className={`${styles["sider"]} ${className || ""}`}
      collapsible={false}
      collapsed={collapsed}
      style={style}
    >
      <Flex
        vertical
        justify="center"
        align="center"
        style={{ height: "100vh" }}
        gap={24}
        className={styles["logo-flex"]}
      >
        <SidebarHeader
          collapsed={collapsed}
          onToggleCollapse={setCollapsed}
        />
        <SidebarContent collapsed={collapsed} />
      </Flex>
    </Sider>
  );
};

export default Sidebar;
