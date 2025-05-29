import { error } from '../utils/response.js';

/**
 * 全局错误处理
 */
export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  // 开发环境禁用
  console.error(err.stack);

  // 处理自定义应用错误
  if (err.isAppError) {
    return error(res, err.message, err.code);
  }

  // 其他错误统一返回服务器错误
  error(res, '服务器内部错误', 500);
};

/**
 * 异步路由包装器
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};