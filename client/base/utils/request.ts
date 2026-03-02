import axios, { AxiosInstance, AxiosResponse, isCancel } from "axios";

/**
 * Axios 实例
 * - baseURL: 代理到后端 `/api`
 * - withCredentials: 携带凭据
 * - timeout: 请求超时时间
 */
const instance: AxiosInstance = axios.create({
  baseURL: "/api",
  timeout: 20 * 1000,
  withCredentials: true,
});

/**
 * 请求拦截器：将 URL 中的占位符替换为 `params` 中的实际值
 * 例如：`/api/get/{id}` → 将 `{id}` 替换为 `params.id`
 */
instance.interceptors.request.use((config) => {
  let url = config.url || "";
  const params = (config.params || {}) as Record<string, any>;
  url = url.replace(/\{(\w+)\}/g, function (match, $1) {
    if (params[$1]) {
      const value = params[$1];
      delete params[$1];
      return encodeURIComponent(value);
    }
    return match;
  });
  config.url = url;
  config.params = params;
  return config;
});

/**
 * 响应拦截器：统一处理后端返回结构
 * - 成功：`code === 200` 返回 `response.data`
 * - 失败：抛出 `Error(msg)`
 */
instance.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    const { code, msg } = response.data || {};
    if (code === 200) {
      return response.data;
    }
    return Promise.reject(new Error(msg || "请求失败"));
  },
  (error) => {
    if (isCancel(error)) {
      return Promise.reject(error);
    }
    const { data } = (error.response || {}) as AxiosResponse<any>;
    if (data) {
      return Promise.reject(new Error((data as any).msg || "请求失败"));
    }
    return Promise.reject(new Error("网络错误，请稍后再试"));
  }
);

export default instance;
