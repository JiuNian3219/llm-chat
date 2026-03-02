FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# 非 root 运行，减小入侵后的影响范围
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
RUN apk add --no-cache su-exec \
    && mkdir -p uploads && chown -R app:app /app

EXPOSE 3001
# 启动时 chown 卷挂载点（Docker 新建卷默认为 root），再降权运行
ENTRYPOINT ["/bin/sh", "-c", "chown -R app:app /app/uploads 2>/dev/null || true; exec su-exec app node dist/index.js"]
