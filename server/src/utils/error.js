/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    // 是否是自定义错误
    this.isAppError = true;
  }
}

/**
 * 服务器内部错误
 */
export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

/**
 * 参数错误
 */
export class ValidationError extends AppError {
  constructor(message = '参数错误') {
    super(message, 400);
  }
}