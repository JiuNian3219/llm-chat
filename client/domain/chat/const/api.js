import { API_BASE_URL } from "@/base/const";

const COZE_BASE = `${API_BASE_URL}/coze`;

export default {
  // Coze API
  coze: {
    streamingChat: {
      url: `${COZE_BASE}/chat/stream`,
      method: "POST",
    },
    nonStreamingChat: {
      url: `${COZE_BASE}/chat/nonStream`,
      method: "POST",
    },
    cancelChat: {
      url: `${COZE_BASE}/chat/cancel`,
      method: "POST",
    },
    upload: {
      url: `${COZE_BASE}/upload`,
      method: "POST",
    },
    cancelUpload: {
      url: `${COZE_BASE}/cancelUpload`,
      method: "POST",
    },
  },
};
