import HeaderCard from "@/src/layout/HeaderCard";
import Sidebar from "@/src/layout/Sidebar";
import { ConfigProvider, Layout } from "antd";
import { Outlet } from "react-router-dom";
const { Content } = Layout;

const Root = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          fontSize: 16,
        },
        components: {
          Layout: {
            bodyBg: "white",
            headerBg: "white",
            siderBg: "#f9fbff",
          },
          Typography: {
            titleMarginBottom: "0px",
            titleMarginTop: "0px",
          },
        },
      }}
    >
      <Layout
        hasSider
        style={{
          height: "100vh",
        }}
      >
        <Sidebar />
        <Layout>
          <HeaderCard />
          <Content>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};
export default Root;
