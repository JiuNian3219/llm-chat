const COZE_BASE = "/coze";

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE";
export interface Endpoint {
  url: string;
  method: HTTPMethod;
}
interface CozeAPI {
  streamingChat: Endpoint;
  subscribeChat: Endpoint;
  nonStreamingChat: Endpoint;
  cancelChat: Endpoint;
  upload: Endpoint;
  cancelUpload: Endpoint;
  conversationList: Endpoint;
  conversationAll: Endpoint;
  conversationDetail: Endpoint;
  conversationMessages: Endpoint;
  conversationTitle: Endpoint;
  conversationUpdateTitle: Endpoint;
  conversationDelete: Endpoint;
}

const coze: CozeAPI = {
  streamingChat: { url: `${COZE_BASE}/chat/stream`, method: "POST" },
  subscribeChat: { url: `${COZE_BASE}/chat/subscribe`, method: "POST" },
  nonStreamingChat: { url: `${COZE_BASE}/chat/nonStream`, method: "POST" },
  cancelChat: { url: `${COZE_BASE}/chat/cancel`, method: "POST" },
  upload: { url: `${COZE_BASE}/upload`, method: "POST" },
  cancelUpload: { url: `${COZE_BASE}/cancelUpload`, method: "POST" },
  conversationList: { url: `${COZE_BASE}/conversation/list`, method: "GET" },
  conversationAll: { url: `${COZE_BASE}/conversation/all`, method: "GET" },
  conversationDetail: { url: `${COZE_BASE}/conversation/{id}`, method: "GET" },
  conversationMessages: { url: `${COZE_BASE}/conversation/{id}/messages`, method: "GET" },
  conversationTitle: {
    url: `${COZE_BASE}/conversation/{id}/title`,
    method: "GET",
  },
  conversationUpdateTitle: {
    url: `${COZE_BASE}/conversation/{id}/title`,
    method: "PUT",
  },
  conversationDelete: {
    url: `${COZE_BASE}/conversation/{id}`,
    method: "DELETE",
  },
};

export default { coze };
