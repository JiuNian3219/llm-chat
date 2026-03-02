/* eslint-disable react-refresh/only-export-components */
import { chatDetailLoader } from "@/src/routers/loaders/chatDetail";
import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Root from "../pages/Root";

const Home = lazy(() => import("@/src/pages/Home"));
const Chat = lazy(() => import("@/src/pages/Chat"));

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

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: LazyHome,
      },
      {
        path: "/chat",
        Component: LazyChat,
      },
      {
        path: "/chat/:conversationId",
        Component: LazyChat,
        loader: chatDetailLoader,
      },
    ],
  },
]);

export default router;
