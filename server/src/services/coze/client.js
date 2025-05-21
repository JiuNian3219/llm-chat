import { COZE_CN_BASE_URL, CozeAPI } from "@coze/api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.COZE_API_TOKEN;
export const botId = process.env.COZE_BOT_ID;

export const client = new CozeAPI({
  baseURL: COZE_CN_BASE_URL,
  token: token,
});