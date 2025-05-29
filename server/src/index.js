import cors from "cors";
import express from "express";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import coze from "./routers/coze.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const port = 3001;

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/coze", coze)

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保 uploads 目录存在
const uploadsDir = join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/files', express.static(join(__dirname, "../uploads")));

// 全局的错误处理器
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express服务器运行在 http://localhost:${port}`);
});
