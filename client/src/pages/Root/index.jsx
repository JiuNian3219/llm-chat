import { ChatProvider } from "@/domain/chat/contexts/useChatContext";
import { ConfigProvider, Layout, Typography } from "antd";
import { Outlet } from "react-router-dom";
import styles from "./index.module.css";
import Sidebar from "@/src/layout/Sidebar";
import { ConversationProvider } from "@/domain/chat/contexts/useConversationContext";
import HeaderCard from "@/src/layout/HeaderCard";
const { Header, Content } = Layout;

const { Title } = Typography;

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
        <ConversationProvider>
          <Sidebar />
          <Layout>
            <HeaderCard />
            <Content>
              <ChatProvider>
                <Outlet />
              </ChatProvider>
            </Content>
          </Layout>
        </ConversationProvider>
      </Layout>
    </ConfigProvider>
  );
};
export default Root;
