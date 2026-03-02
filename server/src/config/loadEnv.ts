import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 从项目根目录加载 .env（server/dist/config/ -> ../../../ = 根目录）
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
