import { beforeEach, describe, expect, it, vi } from "vitest";
import { UPLOAD_LIMITS } from "@/domain/chat/const";
import { validateFiles } from "../fileUploadService";

// ─── Mock ─────────────────────────────────────────────────────────────────────
// fileUploadService 依赖 fileStore / conversationStore / antd / axios
// 此处只测 validateFiles，其余依赖统一 mock 掉

vi.mock("@/domain/chat/stores/fileStore", () => ({
  useFileStore: { getState: vi.fn() },
}));

vi.mock("@/domain/chat/stores/conversationStore", () => ({
  useConversation: { getState: vi.fn() },
}));

vi.mock("antd", () => ({
  message: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return { ...actual, isCancel: vi.fn() };
});

// ─── 辅助 ──────────────────────────────────────────────────────────────────────

import { useFileStore } from "@/domain/chat/stores/fileStore";
import type { ChatFile } from "@/src/types/chat";

const { maxFileCount, fileSize: maxFileSize } = UPLOAD_LIMITS;
const OVER_SIZE = maxFileSize + 1;

/** 构造一个 File 对象（大小/名称可控） */
function makeFile(name: string, size = 100, type = "text/plain"): File {
  return new File(["x".repeat(size)], name, { type });
}

/** 构造一个已在队列中的 ChatFile stub */
function makeQueuedFile(name: string, size = 100): ChatFile {
  return {
    id: `id-${name}`,
    name,
    size,
    type: "file",
    status: "uploading" as any,
  };
}

/** 设置 fileStore 中已有的文件列表 */
function setExistingFiles(files: ChatFile[]) {
  vi.mocked(useFileStore.getState).mockReturnValue({ files } as any);
}

// ─── 测试套件 ──────────────────────────────────────────────────────────────────

describe("validateFiles", () => {
  beforeEach(() => {
    setExistingFiles([]);
  });

  describe("队列为空时的基础校验", () => {
    it("空数组传入，返回空结果", () => {
      const result = validateFiles([]);
      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("合法文件通过校验", () => {
      const file = makeFile("report.txt", 1024);
      const { valid, errors } = validateFiles([file]);

      expect(valid).toContain(file);
      expect(errors).toHaveLength(0);
    });
  });

  describe("文件大小限制（5MB）", () => {
    it("超出大小限制的文件被拒绝并报错", () => {
      const file = makeFile("large.pdf", OVER_SIZE);
      const { valid, errors } = validateFiles([file]);

      expect(valid).toHaveLength(0);
      expect(errors[0]).toContain("large.pdf");
      expect(errors[0]).toContain("大小限制");
    });

    it("恰好等于大小限制的文件通过", () => {
      const file = makeFile("edge.pdf", maxFileSize);
      const { valid } = validateFiles([file]);

      expect(valid).toContain(file);
    });

    it("混合文件：合法的通过，超大的被拒绝，各自独立报错", () => {
      const good = makeFile("small.txt", 100);
      const bad = makeFile("huge.pdf", OVER_SIZE);
      const { valid, errors } = validateFiles([good, bad]);

      expect(valid).toEqual([good]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("huge.pdf");
    });
  });

  describe("重复文件检测（按 name + size 去重）", () => {
    it("与队列中已有文件同名同大小的文件被跳过", () => {
      setExistingFiles([makeQueuedFile("doc.txt", 100)]);

      const dup = makeFile("doc.txt", 100);
      const { valid, errors } = validateFiles([dup]);

      expect(valid).toHaveLength(0);
      expect(errors[0]).toContain("doc.txt");
      expect(errors[0]).toContain("重复");
    });

    it("同名不同大小的文件不视为重复", () => {
      setExistingFiles([makeQueuedFile("doc.txt", 100)]);

      const differentSize = makeFile("doc.txt", 200);
      const { valid, errors } = validateFiles([differentSize]);

      expect(valid).toContain(differentSize);
      expect(errors).toHaveLength(0);
    });

    it("本次选择的文件互相重复时，第二个被跳过", () => {
      const a = makeFile("same.txt", 100);
      const b = makeFile("same.txt", 100);
      const { valid, errors } = validateFiles([a, b]);

      expect(valid).toHaveLength(1);
      expect(valid[0]).toBe(a);
      expect(errors[0]).toContain("same.txt");
    });
  });

  describe("数量上限（maxFileCount = 10）", () => {
    it("队列已满时，所有新文件都被拒绝并报错", () => {
      const full = Array.from({ length: maxFileCount }, (_, i) =>
        makeQueuedFile(`file-${i}.txt`),
      );
      setExistingFiles(full);

      const newFile = makeFile("extra.txt");
      const { valid, errors } = validateFiles([newFile]);

      expect(valid).toHaveLength(0);
      expect(errors[0]).toContain(`最多上传 ${maxFileCount} 个文件`);
    });

    it("选择数量超过剩余槽位时，只取前 N 个并附带警告", () => {
      // 已有 8 个，剩余 2 个槽位，传入 4 个
      const existing = Array.from({ length: 8 }, (_, i) =>
        makeQueuedFile(`existing-${i}.txt`),
      );
      setExistingFiles(existing);

      const incoming = Array.from({ length: 4 }, (_, i) =>
        makeFile(`new-${i}.txt`),
      );
      const { valid, errors } = validateFiles(incoming);

      expect(valid).toHaveLength(2);
      expect(valid[0]).toBe(incoming[0]);
      expect(valid[1]).toBe(incoming[1]);
      expect(errors[0]).toContain("仅上传前 2 个");
    });

    it("选择数量等于剩余槽位时，全部通过且无警告", () => {
      setExistingFiles([makeQueuedFile("existing.txt")]);

      // 剩余 9 个槽位，传入 9 个
      const incoming = Array.from({ length: 9 }, (_, i) =>
        makeFile(`new-${i}.txt`),
      );
      const { valid, errors } = validateFiles(incoming);

      expect(valid).toHaveLength(9);
      expect(errors).toHaveLength(0);
    });
  });

  describe("多规则组合", () => {
    it("超出槽位截断后，截断范围内的超大文件仍然报错", () => {
      // 已有 8 个，剩余 2 个槽位，传入 3 个（第 3 个被截断），前 2 个中有 1 个超大
      const existing = Array.from({ length: 8 }, (_, i) =>
        makeQueuedFile(`existing-${i}.txt`),
      );
      setExistingFiles(existing);

      const good = makeFile("ok.txt", 100);
      const bad = makeFile("big.pdf", OVER_SIZE);
      const dropped = makeFile("dropped.txt", 100);

      const { valid, errors } = validateFiles([good, bad, dropped]);

      expect(valid).toEqual([good]);
      // 截断警告 + 超大文件报错，共 2 条
      expect(errors).toHaveLength(2);
      expect(errors.some((e) => e.includes("仅上传前"))).toBe(true);
      expect(errors.some((e) => e.includes("big.pdf"))).toBe(true);
    });
  });
});
