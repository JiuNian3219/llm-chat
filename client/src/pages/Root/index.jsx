import { ConfigProvider, Flex, Layout, Typography } from "antd";
import { MessageTwoTone } from "@ant-design/icons";
import styles from "./index.module.css";
import { Outlet } from "react-router-dom";
const { Header, Content, Footer, Sider } = Layout;

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
            footerBg: "white",
            siderBg: "white",
            footerPadding: "5px",
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
            style={{
            }}
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
          <Header>
            <p style={{ textAlign: "center" }}>Header</p>
          </Header>
          <Content>
            <Outlet />
          </Content>
          <Footer className={styles["footer-style"]}>
            LLM Chat 也可能会犯错，请核查重要信息。
          </Footer>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};
export default Root;
