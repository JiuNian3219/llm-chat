/**
 * 会话列表项
 * - conversationId: 会话 ID
 * - title: 会话标题
 * - updatedAt: 最后更新时间
 */
export interface ConversationListItem {
  conversationId: string;
  title: string;
  updatedAt: string | Date;
}

/**
 * 会话标题响应体
 * - title: 会话标题
 * - titleReady: 标题是否准备就绪
 */
export interface ConversationTitleResponse {
  title?: string;
  titleReady?: boolean;
}

/**
 * 会话详情响应体
 * - conversationId: 会话 ID
 * - title: 会话标题
 * - messages: 会话消息列表
 */
export interface ConversationDetailResponse {
  conversation?: {
    conversationId: string;
    title?: string;
    messages?: any[];
  };
}
