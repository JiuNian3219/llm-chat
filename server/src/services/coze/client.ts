import { COZE_CN_BASE_URL, CozeAPI } from "@coze/api";
import dotenv from "dotenv";

dotenv.config();

export function getBotId(): string {
  const id = process.env.COZE_BOT_ID;
  if (!id) {
    throw new Error("缺少 COZE_BOT_ID");
  }
  return id;
}

export const client = new CozeAPI({
  baseURL: COZE_CN_BASE_URL,
  token: () => {
    const t = process.env.COZE_API_TOKEN;
    if (!t) {
      throw new Error("缺少 COZE_API_TOKEN");
    }
    return t;
  },
});
