import {
  channelForConversation,
  chatIdKey,
  contentKey,
  redis,
  redisPub,
  statusKey,
} from "../../config/redis.js";

/**
 * 流式事件状态类型
 */
type StreamEventStatus =
  | "in_progress"
  | "completed"
  | "done"
  | "error"
  | "canceled";

/**
 * 流式事件数据结构
 */
type StreamEvent = {
  type:
    | "start"
    | "message"
    | "reasoning"
    | "completed"
    | "follow_up"
    | "done"
    | "error";
  content?: string;
  chatId?: string | null;
  conversationId: string;
  error?: string;
};

// 默认的过期时间为10分钟
const DEFAULT_TTL_SECONDS = 600;

/**
 * 发布事件到会话频道
 * @param evt 事件
 */
export async function publishEvent(evt: StreamEvent) {
  const channel = channelForConversation(evt.conversationId);
  await redisPub.publish(channel, JSON.stringify(evt));
}

/**
 * 设置会话状态
 * @param conversationId 会话ID
 * @param status 会话状态
 */
export async function setStatus(
  conversationId: string,
  status: "in_progress" | "completed" | "done" | "error" | "canceled"
) {
  await redis.set(statusKey(conversationId), status, "EX", DEFAULT_TTL_SECONDS);
}

/**
 * 获取会话快照
 * @param conversationId 会话ID
 * @returns 会话快照
 */
export async function getSnapshot(conversationId: string) {
  const [content, status, lastChatId] = await redis.mget(
    contentKey(conversationId),
    statusKey(conversationId),
    chatIdKey(conversationId)
  );
  return {
    content: content || "",
    status: (status as StreamEventStatus) || null,
    chatId: lastChatId || null,
  };
}

/**
 * 追加消息增量并发布消息事件
 * 用于流式传输对话内容，同时更新Redis中的缓存
 * @param conversationId 会话ID
 * @param chatId 聊天记录ID
 * @param delta 增量内容
 */
export async function appendDelta(
  conversationId: string,
  chatId: string | null,
  delta: string
) {
  if (chatId) {
    await redis.set(
      chatIdKey(conversationId),
      chatId,
      "EX",
      DEFAULT_TTL_SECONDS
    );
  }
  if (delta) {
    await redis.append(contentKey(conversationId), delta);
    await redis.expire(contentKey(conversationId), DEFAULT_TTL_SECONDS);
  }
  await publishEvent({
    type: "message",
    content: delta,
    chatId,
    conversationId,
  });
}

/**
 * 发布会话开始事件
 * 初始化会话状态并清理旧内容
 * @param conversationId 会话ID
 */
export async function publishStart(conversationId: string) {
  await redis.del(contentKey(conversationId));
  await setStatus(conversationId, "in_progress");
  await publishEvent({ type: "start", conversationId });
}

/**
 * 发布推理过程事件
 * 用于展示模型的思考过程（Chain of Thought）
 * @param conversationId 会话ID
 * @param content 推理内容
 */
export async function publishReasoning(
  conversationId: string,
  content: string
) {
  await publishEvent({ type: "reasoning", content, conversationId });
}

/**
 * 发布会话内容完成事件
 * 标记当前回复生成结束
 * @param conversationId 会话ID
 * @param content 完整内容或最终内容
 */
export async function publishCompleted(
  conversationId: string,
  content: string
) {
  await setStatus(conversationId, "completed");
  await publishEvent({ type: "completed", content, conversationId });
}

/**
 * 发布后续建议事件
 * 用于推荐用户可能感兴趣的后续问题
 * @param conversationId 会话ID
 * @param content 建议内容
 */
export async function publishFollowUp(conversationId: string, content: string) {
  await publishEvent({ type: "follow_up", content, conversationId });
}

/**
 * 发布会话结束事件
 * 标记整个会话流程彻底结束
 * @param conversationId 会话ID
 */
export async function publishDone(conversationId: string) {
  await setStatus(conversationId, "done");
  await publishEvent({ type: "done", conversationId });
}

/**
 * 发布错误事件
 * 记录错误状态并通知客户端
 * @param conversationId 会话ID
 * @param error 错误信息
 */
export async function publishError(conversationId: string, error: string) {
  await setStatus(conversationId, "error");
  await publishEvent({ type: "error", conversationId, error });
}
