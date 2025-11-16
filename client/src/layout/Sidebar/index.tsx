import useIsMobile from "@/base/hooks/useIsMobile";
import { useAppStore } from "@/src/stores/appStore";
import { Flex, Layout } from "antd";
import { useEffect, type CSSProperties } from "react";
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
  const isMobile = useIsMobile();
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const openSidebar = useAppStore((s) => s.openSidebar);
  const closeSidebar = useAppStore((s) => s.closeSidebar);

  useEffect(() => {
    if (!isMobile) {
      openSidebar();
    } else {
      closeSidebar();
    }
  }, [isMobile]);
  return (
    <>
      {isMobile && isSidebarOpen && (
        <div
          className={styles["mobile-mask"]}
          style={{ display: isSidebarOpen ? "block" : "none" }}
          onClick={() => toggleSidebar()}
        />
      )}
      <Sider
        width="300px"
        collapsedWidth={isMobile && !isSidebarOpen ? 0 : undefined}
        className={`${styles["sider"]} ${className || ""}`}
        collapsible={false}
        collapsed={!isSidebarOpen}
        style={style}
        trigger={null}
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
            collapsed={!isSidebarOpen}
            onToggleCollapse={toggleSidebar}
          />
          <SidebarContent collapsed={!isSidebarOpen} />
        </Flex>
      </Sider>
    </>
  );
};
export default Sidebar;
