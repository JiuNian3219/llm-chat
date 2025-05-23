import { ConfigProvider, Flex, Layout, Typography } from "antd";
import { MessageTwoTone } from "@ant-design/icons";
import styles from "./index.module.css";
import { Outlet } from "react-router-dom";
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
            siderBg: "white",
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
          className={styles["sider-style"]}
        >
          <Flex
            justify="center"
            align="center"
            className={styles["logo-flex-style"]}
          >
            <MessageTwoTone className={styles["logo-style"]} />
            <Title
              level={3}
              className={styles["logo-title-style"]}
            >
              LLM Chat
            </Title>
          </Flex>
        </Sider>
        <Layout>
          <Header className={styles["header-style"]}>
            <p style={{ textAlign: "center" }}>Header</p>
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
