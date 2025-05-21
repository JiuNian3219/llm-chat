import cors from "cors";
import express from "express";
import coze from "./routers/coze.js";

const app = express();
const port = 3001;

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

app.use(express.json());

app.use("/coze", coze)

app.listen(port, () => {
  console.log(`Express服务器运行在 http://localhost:${port}`);
});
