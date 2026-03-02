# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# 生产构建：同域部署，API 用相对路径
ENV VITE_API_BASE_URL=
RUN npm run build

# 运行阶段：Nginx 托管静态资源 + 反向代理 /coze、/files
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
