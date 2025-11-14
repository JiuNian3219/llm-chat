import type { Response } from "express";

/**
 * 设置 SSE 响应头
 * @param res - 响应对象
 */
export const setupSSE = (res: Response) => {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
};

/**
 * 发送 SSE 消息
 * @param res - 响应对象
 * @param data - 消息数据
 */
export const sendSSEMessage = (res: Response, data: unknown) => {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

/**
 * 发送 SSE 错误并结束连接
 * @param res - 响应对象
 * @param errorMsg - 错误消息
 */
export const sendSSEError = (res: Response, errorMsg: string) => {
  sendSSEMessage(res, { type: "error", error: errorMsg });
  res.end();
};
