import { MessageTwoTone } from "@ant-design/icons";
import { Flex, Typography } from "antd";
import styles from "./index.module.css";

const { Title, Paragraph } = Typography;

/**
 * 显示于AI输入框上方的欢迎组件
 * @param {object} props - 组件属性
 * @param {string} props.title - 标题
 * @param {string} props.description - 描述
 * @returns
 */
const AIGreeting = ({ title, description }) => {
  return (
    <Flex
      vertical
      justify="center"
      align="center"
      gap="10px"
    >
      <Flex>
        <MessageTwoTone className={styles["logo-style"]} />
        <Title
          level={3}
          className={styles["title-style"]}
        >
          {title}
        </Title>
      </Flex>
      <Paragraph className={styles["description-style"]}>
        {description}
      </Paragraph>
    </Flex>
  );
};

export default AIGreeting;
