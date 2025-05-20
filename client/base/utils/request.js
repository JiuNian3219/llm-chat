import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:",
  timeout: 20 * 1000,
  withCredentials: true,
});

// 处理请求参数，讲请求参数中的变量替换为实际值，如：/api/get/{id}，将{id}替换为params中的值
instance.interceptors.request.use((config) => {
  let url = config.url;
  const params = config.params;
  url = url.replace(/\{(\w+)\}/g, function (match, $1) {
    if (params[$1]) {
      const value = params[$1];
      delete params[$1];
      return encodeURIComponent(value);
    }
    return match;
  });
  config.url = url;
  return config;
});

// 提取请求方法和url
instance.interceptors.request.use((config) => {
  const urlConfig = config.url.split(/\s+/);
  if (urlConfig.length > 1) {
    config.method = urlConfig[0].toLowerCase();
    config.url = urlConfig[1];
  }
  return config;
});

instance.interceptors.response.use(
  (response) => {
    const { data, msg, success } = response.data;
    if (success) {
      return data;
    }
    return Promise.reject();
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          break;
        case 404:
          break;
        default:
          break;
      }
    }
    return Promise.reject();
  }
);

export default instance;
