import cors from "cors";
import express from "express";
import { extname } from "path";
import connectDB from "./config/db.js";
import coze from "./routers/coze.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getUploadsDir } from "./utils/file.js";
import { initScheduler } from "./scheduler/index.js";

/** 允许内联展示的扩展名（图片），其余强制下载，防止恶意 HTML/JS 在浏览器执行 */
const INLINE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif", ".bmp", ".tiff", ".tif"]);

const app = express();
const port = 3001;

connectDB();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/coze", coze)

app.use(
  "/files",
  express.static(getUploadsDir(), {
    setHeaders: (res, path) => {
      const ext = extname(String(path)).toLowerCase();
      if (!INLINE_EXTS.has(ext)) {
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);

// 全局的错误处理器
app.use(errorHandler);

initScheduler();

app.listen(port, () => {
  console.log(`Express服务器运行在 http://localhost:${port}`);
});
