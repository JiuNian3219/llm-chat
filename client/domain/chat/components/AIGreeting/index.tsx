import { MessageTwoTone } from "@ant-design/icons";
import { Flex, Typography } from "antd";
import type { CSSProperties } from "react";
import styles from "./index.module.css";

const { Title, Paragraph } = Typography;

interface AIGreetingProps {
  title: string;
  description: string;
  className?: string;
  style?: CSSProperties;
}
/**
 * 显示于AI输入框上方的欢迎组件
 * @param props - 组件属性
 * @param props.title - 标题
 * @param props.description - 描述
 * @param props.className - 可选的自定义类名
 * @param props.style - 可选的自定义样式
 * @returns
 */
const AIGreeting = ({
  title,
  description,
  className,
  style,
}: AIGreetingProps) => {
  return (
    <Flex
      vertical
      justify="center"
      align="center"
      gap="10px"
      className={className}
      style={style}
    >
      <Flex>
        <MessageTwoTone className={styles["logo"]} />
        <Title
          level={3}
          className={styles["title"]}
        >
          {title}
        </Title>
      </Flex>
      <Paragraph className={styles["description"]}>{description}</Paragraph>
    </Flex>
  );
};

export default AIGreeting;
