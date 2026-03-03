/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import Root from "../pages/Root";

const Home = lazy(() => import("@/src/pages/Home"));
const Chat = lazy(() => import("@/src/pages/Chat"));

const ChatLayout = () => <Outlet />;

const LazyHome = () => (
  <Suspense>
    <Home />
  </Suspense>
);

const LazyChat = () => (
  <Suspense>
    <Chat />
  </Suspense>
);

const basename = (import.meta as any).env?.VITE_ROUTER_BASENAME ?? undefined;

const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: Root,
      children: [
        {
          index: true,
          Component: LazyHome,
        },
        {
          path: "chat",
          Component: ChatLayout,
          children: [
            {
              index: true,
              Component: LazyChat,
            },
            {
              path: ":conversationId",
              Component: LazyChat,
            },
          ],
        },
      ],
    },
  ],
  basename ? { basename } : undefined
);

export default router;