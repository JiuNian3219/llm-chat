/**
 * 统一成功响应格式化函数
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [msg]
 * @param {number} [code=200]
 */
export function success(res, data, msg, code = 200) {
  res.status(code).json({
    code: code,
    msg: msg || "",
    data: data,
  });
};

/**
 * 统一报错响应格式化函数
 * @param {import('express').Response} res
 * @param {string} [msg]
 * @param {number} [code=500]
 * @returns
 */
export function error(res, msg, code = 500) {
  res.status(code).json({
    code: code,
    msg: msg || "服务器错误，请稍后再试",
    data: null,
  });
};
