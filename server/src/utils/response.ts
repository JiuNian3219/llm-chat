import type { Response } from "express";
/**
 * 统一成功响应格式化函数
 * @param res 响应对象
 * @param data 响应数据
 * @param msg 响应消息
 * @param code 响应状态码
 */
export function success(
  res: Response,
  data: any,
  msg?: string,
  code: number = 200
) {
  res.status(code).json({
    code: code,
    msg: msg || "",
    data: data,
  });
}

/**
 * 统一报错响应格式化函数
 * @param res 响应对象
 * @param msg 响应消息
 * @param code 响应状态码
 */
export function error(res: Response, msg?: string, code: number = 500) {
  res.status(code).json({
    code: code,
    msg: msg || "服务器错误，请稍后再试",
    data: null,
  });
}
