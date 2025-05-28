import axios from "axios";

const instance = axios.create({
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

instance.interceptors.response.use(
  (response) => {
    const { code, msg } = response.data;
    if (code === 200) {
      return response.data;
    }
    return Promise.reject(new Error(msg || "请求失败"));
  },
  (error) => {
    const { data } = error.response || {};
    if (data) {
      return Promise.reject(new Error(data.msg || "请求失败"));
    }
    return Promise.reject(
      new Error("网络错误，请稍后再试")
    );
  }
);

export default instance;
