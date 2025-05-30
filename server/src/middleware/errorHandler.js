import multer from 'multer';
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

  // 处理文件上传错误
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return error(res, '文件大小超出限制', 400);
      case 'LIMIT_FILE_COUNT':
        return error(res, '上传文件数量超出限制', 400);
      case 'LIMIT_UNEXPECTED_FILE':
        return error(res, '文件上传失败，请检查上传文件', 400);
      default:
        return error(res, '文件上传错误', 500);
    }
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