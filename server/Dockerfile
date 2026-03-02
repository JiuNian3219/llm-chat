FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

# 上传目录（启动时自动创建）
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "dist/index.js"]
