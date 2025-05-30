import cors from "cors";
import express from "express";
import connectDB from "./config/db.js";
import coze from "./routers/coze.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getUploadsDir } from "./utils/file.js";

const app = express();
const port = 3001;

connectDB();

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/coze", coze)

app.use('/files', express.static(getUploadsDir()));

// 全局的错误处理器
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express服务器运行在 http://localhost:${port}`);
});
