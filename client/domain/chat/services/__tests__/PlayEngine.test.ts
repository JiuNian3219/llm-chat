import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MessageStatus } from "@/src/types/message";
import { ChatStatus } from "@/src/types/store";
import { PlayEngine, type PlayEngineHandlers } from "../PlayEngine";

// ─── rAF 控制 ─────────────────────────────────────────────────────────────────
// 用同步的假 rAF 替换浏览器实现，让测试可以精确控制帧的触发时机

let pendingRafCallbacks: ((time: number) => void)[] = [];

function flushFrame() {
  const callbacks = [...pendingRafCallbacks];
  pendingRafCallbacks = [];
  callbacks.forEach((cb) => cb(0));
}

beforeEach(() => {
  pendingRafCallbacks = [];
  vi.stubGlobal("requestAnimationFrame", (cb: (time: number) => void) => {
    pendingRafCallbacks.push(cb);
    return pendingRafCallbacks.length;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── 工厂函数 ──────────────────────────────────────────────────────────────────

function makeHandlers(
  overrides: Partial<PlayEngineHandlers> = {},
): PlayEngineHandlers {
  return {
    onContentDelta: vi.fn(),
    onSnapshot: vi.fn(),
    onMessageStatus: vi.fn(),
    getMessageStatus: vi.fn().mockReturnValue(MessageStatus.Pending),
    onChatId: vi.fn(),
    onFollowUp: vi.fn(),
    onChatStatus: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
}

function makeEngine(handlers: PlayEngineHandlers) {
  return new PlayEngine("msg-001", handlers);
}

// ─── 测试套件 ──────────────────────────────────────────────────────────────────

describe("PlayEngine", () => {
  describe("start 事件", () => {
    it("触发 onChatStatus(Generating)", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "start" });
      flushFrame();

      expect(h.onChatStatus).toHaveBeenCalledWith(ChatStatus.Generating);
    });
  });

  describe("snapshot 事件", () => {
    it("触发 onSnapshot 并将消息状态置为 Streaming", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "snapshot", content: "已生成的内容" });
      flushFrame();

      expect(h.onSnapshot).toHaveBeenCalledWith("已生成的内容");
      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Streaming);
    });

    it("content 为空时传递空字符串", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "snapshot" });
      flushFrame();

      expect(h.onSnapshot).toHaveBeenCalledWith("");
    });
  });

  describe("message 事件 — 文本增量", () => {
    it("单条 message 触发 onContentDelta", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "Hello" });
      flushFrame();

      expect(h.onContentDelta).toHaveBeenCalledTimes(1);
      expect(h.onContentDelta).toHaveBeenCalledWith("Hello");
    });

    it("同一帧内多条 message 合并为一次 onContentDelta 调用", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "A" });
      engine.pushEvent({ type: "message", content: "B" });
      engine.pushEvent({ type: "message", content: "C" });
      flushFrame();

      // 关键：三条消息合并，只调用一次
      expect(h.onContentDelta).toHaveBeenCalledTimes(1);
      expect(h.onContentDelta).toHaveBeenCalledWith("ABC");
    });

    it("携带 chatId 时触发 onChatId", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "Hi", chatId: "chat-123" });
      flushFrame();

      expect(h.onChatId).toHaveBeenCalledWith("chat-123");
    });

    it("不携带 chatId 时不触发 onChatId", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "Hi" });
      flushFrame();

      expect(h.onChatId).not.toHaveBeenCalled();
    });
  });

  describe("Pending → Streaming 状态迁移", () => {
    it("首个 delta 到来时，从 Pending 迁移到 Streaming", () => {
      const h = makeHandlers({
        getMessageStatus: vi.fn().mockReturnValue(MessageStatus.Pending),
      });
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "Hi" });
      flushFrame();

      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Streaming);
      expect(h.onContentDelta).toHaveBeenCalledWith("Hi");
    });

    it("已处于 Streaming 时不重复触发状态迁移", () => {
      const h = makeHandlers({
        getMessageStatus: vi.fn().mockReturnValue(MessageStatus.Streaming),
      });
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "续写" });
      flushFrame();

      // onMessageStatus 不应该因为 message 事件而被调用（没有 completed/done）
      expect(h.onMessageStatus).not.toHaveBeenCalled();
    });
  });

  describe("completed 事件", () => {
    it("触发 onMessageStatus(Completed)，不影响 chatStatus", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "completed" });
      flushFrame();

      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Completed);
      expect(h.onChatStatus).not.toHaveBeenCalled();
    });
  });

  describe("follow_up 事件", () => {
    it("触发 onFollowUp 并传递内容", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "follow_up", content: "你还想了解什么？" });
      flushFrame();

      expect(h.onFollowUp).toHaveBeenCalledWith("你还想了解什么？");
    });
  });

  describe("done 事件", () => {
    it("触发 onChatStatus(Idle) 和 onMessageStatus(Completed)", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "done" });
      flushFrame();

      expect(h.onChatStatus).toHaveBeenCalledWith(ChatStatus.Idle);
      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Completed);
      expect(h.onError).not.toHaveBeenCalled();
    });
  });

  describe("error 事件", () => {
    it("触发 onChatStatus(Error)、onMessageStatus(Error) 和 onError", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "error", error: "服务不可用" });
      flushFrame();

      expect(h.onChatStatus).toHaveBeenCalledWith(ChatStatus.Error);
      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Error);
      expect(h.onError).toHaveBeenCalledWith("服务不可用");
    });

    it("error 字段缺失时使用默认文案", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "error" });
      flushFrame();

      expect(h.onError).toHaveBeenCalledWith("生成出错");
    });
  });

  describe("reasoning 事件", () => {
    it("暂不处理，不触发任何 handler", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "reasoning", content: "思考过程..." });
      flushFrame();

      expect(h.onContentDelta).not.toHaveBeenCalled();
      expect(h.onChatStatus).not.toHaveBeenCalled();
      expect(h.onMessageStatus).not.toHaveBeenCalled();
    });
  });

  describe("多帧调度", () => {
    it("第一帧处理期间新推入的事件，调度到下一帧处理", () => {
      const h = makeHandlers();
      const engine = makeEngine(h);

      engine.pushEvent({ type: "message", content: "第一帧" });

      // 第一帧回调触发时，再推入新事件
      vi.stubGlobal(
        "requestAnimationFrame",
        (cb: (time: number) => void) => {
          pendingRafCallbacks.push(cb);
          return pendingRafCallbacks.length;
        },
      );

      flushFrame(); // 处理「第一帧」

      // 第一帧结束后推入新内容，模拟流式持续到来
      engine.pushEvent({ type: "message", content: "第二帧" });
      flushFrame(); // 处理「第二帧」

      expect(h.onContentDelta).toHaveBeenCalledTimes(2);
      expect(h.onContentDelta).toHaveBeenNthCalledWith(1, "第一帧");
      expect(h.onContentDelta).toHaveBeenNthCalledWith(2, "第二帧");
    });
  });

  describe("完整流程", () => {
    it("start → messages → completed → follow_up → done 全链路", () => {
      const h = makeHandlers({
        getMessageStatus: vi
          .fn()
          .mockReturnValueOnce(MessageStatus.Pending)
          .mockReturnValue(MessageStatus.Streaming),
      });
      const engine = makeEngine(h);

      // 模拟一次完整的 SSE 会话
      engine.pushEvent({ type: "start" });
      engine.pushEvent({ type: "message", content: "你好", chatId: "c-1" });
      engine.pushEvent({ type: "message", content: "，我是" });
      engine.pushEvent({ type: "message", content: "LLM Chat" });
      engine.pushEvent({ type: "completed" });
      engine.pushEvent({ type: "follow_up", content: "需要帮助吗？" });
      engine.pushEvent({ type: "done" });
      flushFrame();

      // start
      expect(h.onChatStatus).toHaveBeenNthCalledWith(1, ChatStatus.Generating);
      // 三条 message 合并为一次写入
      expect(h.onContentDelta).toHaveBeenCalledTimes(1);
      expect(h.onContentDelta).toHaveBeenCalledWith("你好，我是LLM Chat");
      // chatId 只来自第一条携带它的 message
      expect(h.onChatId).toHaveBeenCalledWith("c-1");
      // Pending → Streaming 迁移
      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Streaming);
      // completed
      expect(h.onMessageStatus).toHaveBeenCalledWith(MessageStatus.Completed);
      // follow_up
      expect(h.onFollowUp).toHaveBeenCalledWith("需要帮助吗？");
      // done 终态（最终 onChatStatus 以 done 的 Idle 结尾）
      expect(h.onChatStatus).toHaveBeenLastCalledWith(ChatStatus.Idle);
    });
  });
});
