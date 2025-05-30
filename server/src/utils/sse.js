/**
 * 设置 SSE 响应头
 * @param {import('express').Response} res 
 */
export const setupSSE = (res) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
};

/**
 * 发送 SSE 消息
 * @param {import('express').Response} res 
 * @param {Object} data 
 */
export const sendSSEMessage = (res, data) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

/**
 * 发送 SSE 错误并结束连接
 * @param {import('express').Response} res 
 * @param {string} errorMsg 
 */
export const sendSSEError = (res, errorMsg) => {
  sendSSEMessage(res, { type: "error", error: errorMsg });
  res.end();
};