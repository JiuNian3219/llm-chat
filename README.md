# LLM Chat

基于 Coze API 的全栈 AI 对话应用，实现了 SSE 流式回复、断点续播、多模态文件上传等核心功能。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 · Vite · Zustand · Ant Design 5 |
| 后端 | Node.js · Express 5 · MongoDB · Redis |
| AI | Coze API（SSE 流式 + 非流式） |
| 测试 | Vitest（客户端 64 用例 / 服务端 19 用例） |

## 架构亮点

### 前端：Service + Store 分层

组件不直接发请求，UI 层只读 Store：

```
页面 / 组件         →  只读 Zustand Store
chatService.ts      →  业务编排（发消息、取消、续播、轮询标题）
PlayEngine.ts       →  流式渲染引擎
stores/chatStore    →  纯状态容器（appendContent / setStatus 等原子操作）
base/utils/request  →  Axios 封装（URL 模板替换 / 响应拦截）
```

### PlayEngine：rAF 批量写入

SSE 每秒推送几十个 delta，直接 `setState` 会疯狂重渲染。PlayEngine 先缓冲事件，在 `requestAnimationFrame` 帧内批量合并后**一次性写入 Store**：

```ts
// 同一帧内 N 条 message 事件合并为一次 onContentDelta 调用
for (const event of events) {
  if (event.type === "message") textDelta += event.content;
}
if (textDelta) handlers.onContentDelta(textDelta);
```

通过 `PlayEngineHandlers` 接口注入依赖，PlayEngine 自身零 Store 引用，可独立单元测试。

### 后端：Redis Pub/Sub 解耦生成与推送

```
Client ──SSE──▶ Controller ──subscribe──▶ Redis Channel
                                                ▲
                Service ──appendDelta──▶ Redis  │
                    │                           │
                    └──── Coze API stream ───── ┘
```

Service 调用 Coze API 流式生成，每个 delta 通过 `publishEvent` 写入 Redis channel；Controller 订阅该 channel，收到事件后转发给前端 SSE。生成逻辑与推送逻辑完全解耦。

### 断点续播

切换会话或刷新页面时，SSE 断开但后端继续生成并落库。`appendDelta` 同时用 `redis.append` 累积快照：

```
重新进入会话
  → 检测到 conversation.inProgress = true
  → 订阅 SSE，后端先下发 snapshot（全量已生成内容）
  → 前端 onSnapshot 全量覆盖，再接续后续增量
  → 对用户：感知不到断线过
```

### 并发控制

**取消竞态**：先用内存 `canceledChats: Set<string>` 标记，再调 Coze 取消 API。流式循环里每个 delta 到来时检查该 Set，命中则立即截断并落库，防止取消 API 延迟期间内容继续入库。

**重复发送**：发送前检查 Redis snapshot 中 `status === 'in_progress'`，拦截同一会话的并发请求。

## 本地运行

### 环境要求

- Node.js 20+
- MongoDB（本地或云端）
- Redis（本地或云端）
- [Coze](https://coze.cn) 账号，创建 Bot 后获取 `COZE_API_TOKEN` 和 `COZE_BOT_ID`

### 安装依赖

```bash
# 根目录
npm install

# 前端
cd client && npm install

# 后端
cd server && npm install
```

### 配置环境变量

**`client/.env`**

```env
VITE_API_BASE_URL=http://localhost:3001
```

**`server/.env`**

```env
MONGODB_URL=mongodb://localhost:27017/llm-chat
REDIS_URL=redis://localhost:6379
COZE_API_TOKEN=你的 Token
COZE_BOT_ID=你的 Bot ID
```

### 启动

```bash
# 根目录并行启动前后端
npm run start

# 或分别启动
cd server && npm run dev
cd client && npm run dev
```

前端：http://localhost:5173

### 运行测试

```bash
# 客户端（64 个用例）
cd client && npm test

# 服务端（19 个用例）
cd server && npm test
```

## Docker 部署

```bash
# 1. 在项目根目录创建 .env
cat > .env << EOF
COZE_API_TOKEN=你的 Coze Token
COZE_BOT_ID=你的 Bot ID
CORS_ORIGIN=http://localhost
APP_PORT=80
EOF
# 部署到服务器时：CORS_ORIGIN=http://你的IP（端口 80 时）或 http://你的IP:端口

# 2. 构建并启动
docker compose up -d --build

# 访问 http://localhost（端口 80 时可直接用 IP 访问，简历仅写 IP 即可）
```

MongoDB、Redis 由 docker-compose 提供，无需单独安装。**端口可配置**：`APP_PORT` 默认 80，简历只写 IP 时访客输入 `http://IP` 即可。

### GitHub Actions 自动部署

push 到 `main` 后，CI 会：构建 client/server 镜像 → 推送至 GHCR → SSH 到服务器执行 `docker compose pull` + `up -d`。**服务器无需 git、无需 clone**，只需 Docker。

需在仓库 **Settings → Secrets and variables → Actions** 中配置：

| Secret | 说明 |
|--------|------|
| `SSH_HOST` | 服务器 IP 或域名 |
| `SSH_USER` | SSH 用户名（如 root） |
| `SSH_PRIVATE_KEY` | SSH 私钥完整内容 |
| `SSH_PORT` | SSH 端口（可选，缺省 22） |
| `COZE_API_TOKEN` | Coze API Token（用于写入部署时的 .env） |
| `COZE_BOT_ID` | Coze Bot ID |
| `CORS_ORIGIN` | 浏览器访问地址，如 `http://你的IP`（端口 80）或 `http://你的IP:端口`（可选，缺省 `http://localhost`） |
| `APP_PORT` | 对外暴露端口（可选，缺省 80） |

**首次部署前**：服务器需安装 Docker 与 Docker Compose。部署目录为 `~/llm-chat`。镜像需为公开（GHCR Package 设置）或配置拉取凭证。

## 目录结构

```
client/
├── base/               # 基础设施（request、通用组件、hooks）
├── domain/chat/        # chat 业务域
│   ├── services/       # chatService、fileUploadService、PlayEngine
│   ├── stores/         # chatStore、conversationStore、fileStore
│   └── components/     # UI 组件（message、input、structure、markdown）
└── src/
    ├── pages/          # Chat、Home、Root
    ├── layout/         # Sidebar、HeaderCard
    └── types/          # 全局类型定义

server/src/
├── controllers/        # 请求/响应处理
├── services/
│   ├── coze/           # chat、upload（对接 Coze API）
│   ├── database/       # conversation、message、file（MongoDB）
│   └── stream/         # hub（Redis Pub/Sub）
├── models/             # Mongoose 数据模型
├── middleware/         # errorHandler、upload
├── utils/              # error、response、sse
└── scheduler/          # 定时清理过期文件
```

## API 概览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/coze/chat/stream` | 流式聊天（SSE） |
| POST | `/coze/chat/nonStream` | 非流式聊天 |
| POST | `/coze/chat/cancel` | 取消生成 |
| POST | `/coze/chat/subscribe` | 断线续播 |
| POST | `/coze/upload` | 上传文件 |
| GET | `/coze/conversation/list` | 分页会话列表 |
| GET | `/coze/conversation/:id` | 会话详情 |
| GET | `/coze/conversation/:id/title` | 会话标题 |

SSE 事件类型：`start` / `snapshot` / `message` / `completed` / `follow_up` / `done` / `error`
