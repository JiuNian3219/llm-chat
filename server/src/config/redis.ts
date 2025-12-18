import { Redis } from "ioredis";

const url = process.env.REDIS_URL;

const base = url ? new Redis(url) : new Redis();

/**
 * Redis客户端
 */
export const redis = base;
/**
 * 会话频道发布者
 */
export const redisPub = base.duplicate();
/**
 * 会话频道订阅者
 */
export const redisSub = base.duplicate();

/**
 * 会话频道ID
 * @param conversationId 会话ID
 * @returns 会话频道ID
 */
export function channelForConversation(conversationId: string) {
  return `chat:channel:${conversationId}`;
}

/**
 * 会话内容键
 * @param conversationId 会话ID
 * @returns 会话内容键
 */
export function contentKey(conversationId: string) {
  return `chat:content:${conversationId}`;
}

/**
 * 会话状态键
 * @param conversationId 会话ID
 * @returns 会话状态键
 */
export function statusKey(conversationId: string) {
  return `chat:status:${conversationId}`;
}

/**
 * 会话最后一条消息ID键
 * @param conversationId 会话ID
 * @returns 会话最后一条消息ID键
 */
export function chatIdKey(conversationId: string) {
  return `chat:last_chat_id:${conversationId}`;
}
