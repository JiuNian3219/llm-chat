import { createBrowserRouter } from "react-router-dom";
import Home from "@/src/pages/Home";
import Chat from "@/src/pages/Chat";
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
      }
    ]
  },
]);

export default router;
