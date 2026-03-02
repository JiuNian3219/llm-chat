import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从 server/ 目录加载 .env（src/config/ 或 dist/config/ -> ../../ = server/）
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
