import { createBrowserRouter } from "react-router-dom";
import Home from "@/src/pages/Home";

const router = createBrowserRouter([
  {
    path: "/",
    index: true,
    Component: Home,
  },
]);

export default router;
