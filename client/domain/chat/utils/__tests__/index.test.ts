import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { UploadStatus } from "@/src/types/chat";
import { MessageStatus } from "@/src/types/message";
import {
  copyText,
  formatFileSize,
  formatServerMessages,
  generateMultimodalMessage,
  getFileType,
  getFormattedFileType,
  isImageType,
} from "../index";

// ─── copyText ─────────────────────────────────────────────────────────────────

describe("copyText", () => {
  const mockMessageApi = {
    success: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("复制成功时返回 true 并调用 success 回调", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    const result = await copyText("hello", mockMessageApi);

    expect(result).toBe(true);
    expect(mockMessageApi.success).toHaveBeenCalledWith("复制成功");
  });

  it("复制失败时返回 false 并调用 error 回调", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    const result = await copyText("hello", mockMessageApi);

    expect(result).toBe(false);
    expect(mockMessageApi.error).toHaveBeenCalledWith("复制失败");
  });

  it("不传 messageApi 时不报错", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });

    await expect(copyText("hello")).resolves.toBe(true);
  });
});

// ─── getFileType ──────────────────────────────────────────────────────────────

describe("getFileType", () => {
  it("返回小写扩展名", () => {
    expect(getFileType("report.PDF")).toBe("pdf");
    expect(getFileType("image.PNG")).toBe("png");
  });

  it("多级扩展名只取最后一级", () => {
    expect(getFileType("archive.tar.gz")).toBe("gz");
  });

  it("无扩展名时返回空字符串", () => {
    expect(getFileType("README")).toBe("readme");
  });

  it("空字符串返回空字符串", () => {
    expect(getFileType("")).toBe("");
  });

  it("非字符串类型返回空字符串", () => {
    expect(getFileType(null as any)).toBe("");
    expect(getFileType(undefined as any)).toBe("");
  });
});

// ─── isImageType ──────────────────────────────────────────────────────────────

describe("isImageType", () => {
  it("以 image/ 开头的 MIME 类型返回 true", () => {
    expect(isImageType("image/jpeg")).toBe(true);
    expect(isImageType("image/png")).toBe(true);
    expect(isImageType("image/webp")).toBe(true);
  });

  it("大写也能识别（不区分大小写）", () => {
    expect(isImageType("IMAGE/JPEG")).toBe(true);
  });

  it("非图片 MIME 类型返回 false", () => {
    expect(isImageType("application/pdf")).toBe(false);
    expect(isImageType("text/plain")).toBe(false);
  });

  it("空字符串返回 false", () => {
    expect(isImageType("")).toBe(false);
  });

  it("非字符串返回 false", () => {
    expect(isImageType(null as any)).toBe(false);
  });
});

// ─── getFormattedFileType ─────────────────────────────────────────────────────

describe("getFormattedFileType", () => {
  it("返回大写扩展名", () => {
    expect(getFormattedFileType("report.pdf")).toBe("PDF");
    expect(getFormattedFileType("photo.jpg")).toBe("JPG");
  });

  it("无扩展名时返回「未知类型」", () => {
    expect(getFormattedFileType("README")).toBe("README");
  });

  it("空字符串返回「未知类型」", () => {
    expect(getFormattedFileType("")).toBe("未知类型");
  });
});

// ─── formatFileSize ───────────────────────────────────────────────────────────

describe("formatFileSize", () => {
  it("小于 1KB 显示 B", () => {
    expect(formatFileSize(512)).toBe("512.00 B");
  });

  it("KB 级别正确换算", () => {
    expect(formatFileSize(1024)).toBe("1.00 KB");
    expect(formatFileSize(1536)).toBe("1.50 KB");
  });

  it("MB 级别正确换算", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.00 MB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });

  it("GB 级别正确换算", () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.00 GB");
  });

  it("0 字节返回 0.00 B", () => {
    expect(formatFileSize(0)).toBe("0.00 B");
  });

  it("负数返回「未知大小」", () => {
    expect(formatFileSize(-1)).toBe("未知大小");
  });

  it("非数字返回「未知大小」", () => {
    expect(formatFileSize("abc" as any)).toBe("未知大小");
  });
});

// ─── generateMultimodalMessage ────────────────────────────────────────────────

describe("generateMultimodalMessage", () => {
  it("生成包含文件条目和文本条目的 JSON 字符串", () => {
    const files = [
      { id: "file-001", type: "image" as const, name: "photo.jpg", size: 100, status: UploadStatus.Done },
      { id: "file-002", type: "file" as const, name: "doc.pdf", size: 200, status: UploadStatus.Done },
    ];

    const result = JSON.parse(generateMultimodalMessage("描述一下", files));

    expect(result).toEqual([
      { file_id: "file-001", type: "image" },
      { file_id: "file-002", type: "file" },
      { type: "text", text: "描述一下" },
    ]);
  });

  it("文本节点始终在最后", () => {
    const files = [
      { id: "f1", type: "file" as const, name: "a.pdf", size: 1, status: UploadStatus.Done },
    ];
    const result = JSON.parse(generateMultimodalMessage("问题", files));

    expect(result[result.length - 1]).toMatchObject({ type: "text" });
  });

  it("text 为空时返回空字符串", () => {
    const files = [
      { id: "f1", type: "file" as const, name: "a.pdf", size: 1, status: UploadStatus.Done },
    ];
    expect(generateMultimodalMessage("", files)).toBe("");
  });

  it("files 为空时返回空字符串", () => {
    expect(generateMultimodalMessage("hello", [])).toBe("");
  });
});

// ─── formatServerMessages ────────────────────────────────────────────────────

describe("formatServerMessages", () => {
  const baseMessage = {
    _id: "msg-1",
    chatId: "chat-1",
    role: "assistant" as const,
    content: "你好",
    contentType: "text" as const,
    files: [],
    followUps: ["继续？"],
    status: undefined as any,
  };

  it("空数组返回空数组", () => {
    expect(formatServerMessages([])).toEqual([]);
  });

  it("非数组返回空数组", () => {
    expect(formatServerMessages(null as any)).toEqual([]);
  });

  it("正常文本消息映射字段正确", () => {
    const [msg] = formatServerMessages([baseMessage]);

    expect(msg.id).toBe("msg-1");
    expect(msg.chatId).toBe("chat-1");
    expect(msg.role).toBe("assistant");
    expect(msg.content).toBe("你好");
    expect(msg.followUps).toEqual(["继续？"]);
    expect(msg.status).toBe(MessageStatus.Completed);
  });

  it("status=canceled 映射为 MessageStatus.Canceled", () => {
    const [msg] = formatServerMessages([{ ...baseMessage, status: "canceled" }]);
    expect(msg.status).toBe(MessageStatus.Canceled);
  });

  it("status=error 映射为 MessageStatus.Error", () => {
    const [msg] = formatServerMessages([{ ...baseMessage, status: "error" }]);
    expect(msg.status).toBe(MessageStatus.Error);
  });

  it("followUps 缺失时默认为空数组", () => {
    const [msg] = formatServerMessages([{ ...baseMessage, followUps: undefined }]);
    expect(msg.followUps).toEqual([]);
  });

  it("object_string 类型：解析出纯文本内容", () => {
    const objectContent = JSON.stringify([
      { type: "image", file_id: "f1" },
      { type: "text", text: "解析我" },
    ]);
    const serverMsg = {
      ...baseMessage,
      contentType: "object_string" as const,
      content: objectContent,
      files: [
        {
          fileId: "f1",
          originalname: "photo.jpg",
          size: 1024,
          url: "/files/photo.jpg",
          isImage: true,
        },
      ],
    };

    const [msg] = formatServerMessages([serverMsg]);

    expect(msg.content).toBe("解析我");
    expect(msg.files).toHaveLength(1);
    expect(msg.files![0]).toMatchObject({
      id: "f1",
      name: "photo.jpg",
      size: 1024,
      type: "image",
      status: UploadStatus.Done,
    });
  });

  it("object_string 类型：无 text 节点时内容为空字符串", () => {
    const objectContent = JSON.stringify([
      { type: "image", file_id: "f1" },
    ]);
    const serverMsg = {
      ...baseMessage,
      contentType: "object_string" as const,
      content: objectContent,
      files: [],
    };

    const [msg] = formatServerMessages([serverMsg]);
    expect(msg.content).toBe("");
  });
});
