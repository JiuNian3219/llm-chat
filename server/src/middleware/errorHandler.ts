import type { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { error } from "../utils/response.js";

/**
 * 全局错误处理中间件
 * @param err - 错误对象
 * @param req - 请求对象
 * @param res - 响应对象
 * @param _next - 下一个中间件函数
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err.message);
  console.error(err.stack);

  // 处理自定义应用错误
  if (err.isAppError) {
    return error(res, err.message, err.code);
  }

  // 处理文件上传错误
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return error(res, "文件大小超出限制", 400);
      case "LIMIT_FILE_COUNT":
        return error(res, "上传文件数量超出限制", 400);
      case "LIMIT_UNEXPECTED_FILE":
        return error(res, "文件上传失败，请检查上传文件", 400);
      default:
        return error(res, "文件上传错误", 500);
    }
  }

  // 其他错误统一返回服务器错误
  error(res, "服务器内部错误", 500);
};

/**
 * 异步路由包装器
 * @param fn - 路由处理函数
 * @returns 包装后的路由处理函数
 */
export const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
