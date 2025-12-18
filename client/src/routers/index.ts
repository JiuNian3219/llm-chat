import Chat from "@/src/pages/Chat";
import Home from "@/src/pages/Home";
import { chatDetailLoader } from "@/src/routers/loaders/chatDetail";
import { createBrowserRouter } from "react-router-dom";
import Root from "../pages/Root";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "/chat",
        Component: Chat,
      },
      {
        path: "/chat/:conversationId",
        Component: Chat,
        loader: chatDetailLoader,
      },
    ],
  },
]);

export default router;
