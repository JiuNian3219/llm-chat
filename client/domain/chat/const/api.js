const COZE_BASE = "/coze";

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
    conversationList: {
      url: `${COZE_BASE}/conversation/list`,
      method: "GET",
    },
    conversationAll: {
      url: `${COZE_BASE}/conversation/all`,
      method: "GET",
    },
    conversationDetail: {
      url: `${COZE_BASE}/conversation/{id}`,
      method: "GET",
    },
    conversationTitle: {
      url: `${COZE_BASE}/conversation/{id}/title`,
      method: "GET",
    },
  },
};
