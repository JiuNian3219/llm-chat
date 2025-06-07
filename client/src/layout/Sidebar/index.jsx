import { Flex, Layout } from "antd";
import { useState } from "react";
import styles from "./index.module.css";
import SidebarHeader from "./components/SidebarHeader";
import SidebarContent from "./components/SidebarContent";


const { Sider } = Layout;

/**
 * 侧边栏组件，包含头部和内容部分
 * @param {Object} props - 组件属性
 * @param {Object} [props.style] - 额外的样式
 * @param {string} [props.className] - 额外的类名
 * @returns
 */
const Sidebar = ({ style, className }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sider
      width="300px"
      className={`${styles["sider"]} ${className || ""}`}
      collapsible={null}
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
