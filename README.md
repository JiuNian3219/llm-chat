# llm-js

一个基于 React + Vite + Ant Design 的对话应用，后端采用 Node.js + Express + MongoDB，并集成 Coze API。支持 SSE 流式对话、文件上传与会话管理（列表、标题、分页）、Markdown 渲染与代码高亮，以及定时清理过期文件。

## 特性

- 流式对话（SSE）：边生成边渲染，对话更顺滑
- 非流式对话：一次性返回完整回复
- 文件上传：5MB 单文件上限、类型白名单、最多 10 个
- 会话管理：获取全部/分页列表、标题、详情
- Markdown 渲染与代码高亮、表格优化显示
- 定时任务：每日清理 30 天前的过期文件

## 技术栈

- 前端：React 19、Vite 6、Ant Design 5、axios、react-markdown、fetch-event-source
- 后端：Node.js、Express 5、Mongoose 8、multer、@coze/api、node-cron
- 数据库：MongoDB

## 目录结构

- `client/` 前端代码（Vite + React）
- `server/` 后端代码（Express + MongoDB）
- `server/uploads/` 后端本地文件存储目录（静态访问 `/files/...`）
- 根脚本：并行启动前后端

## 快速开始

### 1) 环境准备

- Node.js 18+（建议 20+）
- 本地或云端 MongoDB
- Coze API 账号、Bot，并获取 `COZE_API_TOKEN` 与 `COZE_BOT_ID`

### 2) 安装依赖

在 `client/` 安装前端依赖

```bash
cd client && npm install
```

在 `server/` 安装后端依赖

```bash
cd server && npm install
```

可选：在根目录安装并行启动工具（已在根 `package.json` 中作为 dev 依赖）

```bash
npm install
```

### 3) 配置环境变量

前端（已在 `client/.env` 提供默认值）：

```bash
echo VITE_API_BASE_URL=/api > client\.env
```

- `VITE_API_BASE_URL` 默认为 `/api`，通过 Vite 代理指向后端 `http://localhost:3001`

后端（在 `server/.env` 新建并配置）：

```bash
echo MONGODB_URL=mongodb://localhost:27017/llm-js > server\.env
```

```bash
echo COZE_API_TOKEN=你的_coze_api_token >> server\.env
```

```bash
echo COZE_BOT_ID=你的_coze_bot_id >> server\.env
```

说明：
- 服务端端口固定为 `3001`（代码中写死）
- CORS 默认仅允许 `http://localhost:5173`

### 4) 启动项目

方式一：分别启动前后端（便于定位问题）

```bash
cd server && npm run dev
```

```bash
cd client && npm run dev
```

方式二：根目录并行启动（确保 client/server 都已安装依赖）

```bash
npm run start
```

打开前端地址

```bash
start http://localhost:5173/
```

## 请求代理与静态资源

- 前端通过 Vite 代理将以 `/api` 开头的请求转发到后端 `http://localhost:3001`（见 `client/vite.config.js`）
- 服务端将本地 `server/uploads/` 目录作为静态资源，访问路径为 `/files/<文件名>`

## 后端 API 概览

- POST `/coze/chat/stream`：流式聊天（SSE）
  - body: `content`, `contentType` ("text" | "object_string"), `conversationId?`
- POST `/coze/chat/nonStream`：非流式聊天
  - body: `content`, `contentType`, `conversationId?`
- POST `/coze/chat/cancel`：取消聊天
  - body: `conversationId`, `chatId`
- POST `/coze/upload`：上传文件（`multipart/form-data`）
  - form: `file`, `conversationId`
- POST `/coze/cancelUpload`：取消文件上传
  - body: `fileId`
- GET `/coze/conversation/list?page&size`：分页会话列表（每页最大 100）
- GET `/coze/conversation/all`：全部会话列表
- GET `/coze/conversation/:id`：会话详情
- GET `/coze/conversation/:id/title`：会话标题

响应规范：
- 常规接口：`{ code, msg, data }`，`code === 200` 表示成功
- 流式接口：`text/event-stream`，事件类型包含 `start/message/completed/follow_up/done/error`

## 上传限制与清理策略

- 单文件最大 `5MB`
- 最多 `10` 个文件
- 类型白名单（文档、编程文件、图片等，见 `server/src/services/utils/constants.js`）
- 定时任务每日 2:00 清理创建时间超过 30 天的文件（见 `server/src/scheduler/index.js`）
- 删除逻辑：标记数据库记录为 `isDeleted: true`，并清理物理文件

## 常用脚本

根目录：
- `npm run start`：并行启动后端与前端

客户端 `client/`：
- `npm run dev`：本地开发（Vite）
- `npm run build`：打包
- `npm run preview`：预览打包产物
- `npm run lint`：代码检查

服务端 `server/`：
- `npm run dev`：开发（nodemon）
- `npm run start`：生产启动

## 约束与注意事项

- 后端目前将端口固定为 `3001`，如需修改请调整 `server/src/index.js`
- CORS 默认仅允许 `http://localhost:5173`，生产需按需配置
- `.env*` 已加入 `.gitignore`，请勿提交敏感信息

## Roadmap

- [ ] 优化取消上传服务（前后端）
- [ ] 会话消息分页查询

详见 `todo` 文件。