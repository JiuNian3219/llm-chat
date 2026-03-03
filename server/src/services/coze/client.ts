import { COZE_CN_BASE_URL, CozeAPI } from "@coze/api";

import "../../config/loadEnv.js";

export function getBotId(): string {
  const id = process.env.COZE_BOT_ID;
  if (!id) {
    throw new Error("缺少 COZE_BOT_ID");
  }
  return id;
}

/** 返回专用于生成会话标题的 Bot ID，未配置时回退到主 Bot */
export function getTitleBotId(): string {
  return process.env.COZE_TITLE_BOT_ID || getBotId();
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
