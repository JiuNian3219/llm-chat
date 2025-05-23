import { MessageTwoTone } from "@ant-design/icons";
import { ConfigProvider, Flex, Layout, Typography } from "antd";
import { Outlet } from "react-router-dom";
import styles from "./index.module.css";
const { Header, Content, Sider } = Layout;

const { Title } = Typography;

const Root = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
        components: {
          Layout: {
            bodyBg: "white",
            headerBg: "white",
            siderBg: "#f9fbff",
          },
          Typography: {
            titleMarginBottom: "0px",
            titleMarginTop: "0px"
          }
        },
      }}
    >
      <Layout hasSider>
        <Sider
          width="300px"
          className={styles["sider"]}
        >
          <Flex
            justify="center"
            align="center"
            className={styles["logo-flex"]}
          >
            <MessageTwoTone className={styles["logo"]} />
            <Title
              level={3}
              className={styles["logo-title"]}
            >
              LLM Chat
            </Title>
          </Flex>
        </Sider>
        <Layout>
          <Header className={styles["header"]}>
            <Title level={4} className={styles["header-title"]}>关闭搜狗输入法Ctrl+Space快捷键</Title>
          </Header>
          <Content>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};
export default Root;
