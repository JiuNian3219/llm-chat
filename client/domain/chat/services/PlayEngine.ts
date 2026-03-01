import { MessageStatus } from "@/src/types/message";
import { ChatStatus } from "@/src/types/store";

/**
 * PlayEngine 所需的外部能力接口。
 * 由 chatService 在构造时注入，PlayEngine 自身不依赖任何 Store。
 */
export interface PlayEngineHandlers {
  /** 追加文本增量 */
  onContentDelta: (delta: string) => void;
  /** 断线重连后全量覆盖内容 */
  onSnapshot: (content: string) => void;
  /** 更新消息状态 */
  onMessageStatus: (status: MessageStatus) => void;
  /** 读取当前消息状态（用于 Pending→Streaming 迁移判断） */
  getMessageStatus: () => MessageStatus;
  /** 更新消息关联的 chatId */
  onChatId: (chatId: string) => void;
  /** 追加一条 follow-up 建议 */
  onFollowUp: (item: string) => void;
  /** 更新会话级流程状态 */
  onChatStatus: (status: ChatStatus) => void;
  /** 写入错误信息到消息内容 */
  onError: (msg: string) => void;
}

/**
 * 流式播放引擎
 *
 * 将后端 SSE 事件流缓冲后，在每一个 requestAnimationFrame 帧内批量处理，
 * 合并文本增量后一次性写入 Store，避免高频渲染。
 * 通过 PlayEngineHandlers 接口与外部解耦，可独立测试。
 */
export class PlayEngine {
  private buffer: any[] = [];
  private handlers: PlayEngineHandlers;
  private isPlaying: boolean = false;

  constructor(_messageId: string, handlers: PlayEngineHandlers) {
    this.handlers = handlers;
  }

  public pushEvent(event: any) {
    this.buffer.push(event);
    this.schedulePlay();
  }

  private schedulePlay() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    requestAnimationFrame(() => this.play());
  }

  private play() {
    if (this.buffer.length === 0) {
      this.isPlaying = false;
      return;
    }

    const events = [...this.buffer];
    this.buffer = [];

    let textDelta = "";
    let shouldFinish = false;
    let finishMsgStatus: MessageStatus = MessageStatus.Completed;
    let finishChatStatus: ChatStatus = ChatStatus.Idle;
    let errorMsg = "";

    for (const event of events) {
      switch (event.type) {
        case "start":
          this.handlers.onChatStatus(ChatStatus.Generating);
          break;

        case "snapshot":
          // 断线重连后全量覆盖已累积内容，直接进入 streaming 状态
          this.handlers.onSnapshot(event.content || "");
          this.handlers.onMessageStatus(MessageStatus.Streaming);
          break;

        case "message":
          textDelta += event.content || "";
          if (event.chatId) {
            this.handlers.onChatId(event.chatId);
          }
          break;

        case "reasoning":
          // 推理内容暂不渲染，预留扩展
          break;

        case "completed":
          // 文本已全部生成，标记 completed
          // chatStore.status 仍保持 generating（等待 follow_up + done）
          this.handlers.onMessageStatus(MessageStatus.Completed);
          break;

        case "follow_up":
          this.handlers.onFollowUp(event.content);
          break;

        case "done":
          shouldFinish = true;
          finishMsgStatus = MessageStatus.Completed;
          finishChatStatus = ChatStatus.Idle;
          break;

        case "error":
          shouldFinish = true;
          finishMsgStatus = MessageStatus.Error;
          finishChatStatus = ChatStatus.Error;
          errorMsg = event.error || "生成出错";
          break;
      }
    }

    // 应用文本增量
    // 首个 delta 到达时将消息状态从 Pending 迁移到 Streaming
    if (textDelta) {
      if (this.handlers.getMessageStatus() === MessageStatus.Pending) {
        this.handlers.onMessageStatus(MessageStatus.Streaming);
      }
      this.handlers.onContentDelta(textDelta);
    }

    // 处理终态
    if (shouldFinish) {
      this.handlers.onChatStatus(finishChatStatus);
      this.handlers.onMessageStatus(finishMsgStatus);
      if (finishMsgStatus === MessageStatus.Error) {
        this.handlers.onError(errorMsg);
      }
    }

    // 若缓冲区又有新事件，继续下一帧
    if (this.buffer.length > 0) {
      requestAnimationFrame(() => this.play());
    } else {
      this.isPlaying = false;
    }
  }
}
