import {
  LeftSquareOutlined,
  MessageTwoTone,
  RightSquareOutlined,
} from "@ant-design/icons";
import { Button, Flex, Typography } from "antd";
import styles from "./index.module.css";

const { Title } = Typography;

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}
/**
 * 侧边栏头部组件，显示Logo和折叠按钮
 * @param props - 组件属性
 * @param props.collapsed - 是否折叠
 * @param props.onToggleCollapse - 折叠状态切换函数
 * @returns
 */
const SidebarHeader = ({ collapsed, onToggleCollapse }: SidebarHeaderProps) => {
  if (collapsed) {
    return (
      <>
        <MessageTwoTone className={styles["logo"]} />
        <Button
          type="text"
          onClick={() => onToggleCollapse(false)}
        >
          <RightSquareOutlined className={styles["button-icon"]} />
        </Button>
      </>
    );
  }

  return (
    <Flex
      justify="space-between"
      align="center"
      className={styles["logo-container"]}
    >
      <Flex align="center">
        <MessageTwoTone className={styles["logo"]} />
        <Title
          level={3}
          className={styles["logo-title"]}
        >
          LLM Chat
        </Title>
      </Flex>
      <Button
        type="text"
        onClick={() => onToggleCollapse(true)}
      >
        <LeftSquareOutlined className={styles["button-icon"]} />
      </Button>
    </Flex>
  );
};

export default SidebarHeader;
