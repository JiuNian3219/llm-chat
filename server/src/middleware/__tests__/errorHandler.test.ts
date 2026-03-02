import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { asyncHandler, errorHandler } from "../errorHandler.js";
import {
  AppError,
  CustomError,
  FileUploadError,
  NotFoundError,
  ValidationError,
} from "../../utils/error.js";

// ─── 辅助 ─────────────────────────────────────────────────────────────────────

function makeRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function makeReqNext() {
  return {
    req: {} as Request,
    next: vi.fn() as unknown as NextFunction,
  };
}

// ─── AppError 子类 ────────────────────────────────────────────────────────────

describe("AppError 及其子类", () => {
  it("AppError 默认 statusCode 为 500，isAppError 为 true", () => {
    const err = new AppError("出错了");
    expect(err.statusCode).toBe(500);
    expect(err.isAppError).toBe(true);
    expect(err.message).toBe("出错了");
  });

  it("AppError 可自定义 statusCode", () => {
    const err = new AppError("自定义", 422);
    expect(err.statusCode).toBe(422);
  });

  it("NotFoundError statusCode 为 404", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("资源不存在");
  });

  it("NotFoundError 可传自定义消息", () => {
    const err = new NotFoundError("会话不存在");
    expect(err.message).toBe("会话不存在");
  });

  it("ValidationError statusCode 为 400", () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("参数错误");
  });

  it("FileUploadError statusCode 为 400", () => {
    const err = new FileUploadError();
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("文件上传失败");
  });

  it("CustomError 可自定义 statusCode", () => {
    const err = new CustomError("权限不足", 403);
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("权限不足");
  });

  it("CustomError 默认 statusCode 为 500", () => {
    const err = new CustomError("未知错误");
    expect(err.statusCode).toBe(500);
  });
});

// ─── errorHandler ─────────────────────────────────────────────────────────────

describe("errorHandler", () => {
  let res: Response;

  beforeEach(() => {
    res = makeRes();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("AppError（isAppError = true）", () => {
    it("ValidationError → 400 + 错误消息", () => {
      const err = new ValidationError("内容不能为空");
      errorHandler(err, {} as Request, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 400, msg: "内容不能为空" })
      );
    });

    it("NotFoundError → 404 + 错误消息", () => {
      const err = new NotFoundError("会话不存在");
      errorHandler(err, {} as Request, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 404, msg: "会话不存在" })
      );
    });

    it("CustomError(403) → 403 + 错误消息", () => {
      const err = new CustomError("禁止访问", 403);
      errorHandler(err, {} as Request, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("MulterError（文件上传错误）", () => {
    function makeMulterError(code: string): multer.MulterError {
      const err = new multer.MulterError(code as any);
      return err;
    }

    it("LIMIT_FILE_SIZE → 400 + 文件大小超出限制", () => {
      errorHandler(makeMulterError("LIMIT_FILE_SIZE"), {} as Request, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: "文件大小超出限制" })
      );
    });

    it("LIMIT_FILE_COUNT → 400 + 上传文件数量超出限制", () => {
      errorHandler(makeMulterError("LIMIT_FILE_COUNT"), {} as Request, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: "上传文件数量超出限制" })
      );
    });

    it("LIMIT_UNEXPECTED_FILE → 400 + 文件上传失败，请检查上传文件", () => {
      errorHandler(makeMulterError("LIMIT_UNEXPECTED_FILE"), {} as Request, res, vi.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: "文件上传失败，请检查上传文件" })
      );
    });

    it("其他 MulterError code → 500 + 文件上传错误", () => {
      errorHandler(makeMulterError("LIMIT_PART_COUNT"), {} as Request, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: "文件上传错误" })
      );
    });
  });

  describe("未知错误（普通 Error）", () => {
    it("普通 Error → 500 + 服务器内部错误", () => {
      const err = new Error("数据库连接失败");
      errorHandler(err, {} as Request, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ msg: "服务器内部错误" })
      );
    });
  });
});

// ─── asyncHandler ─────────────────────────────────────────────────────────────

// asyncHandler 内部 Promise 不对外 return（符合 Express 中间件签名）
// 需要 flushPromises 等微任务队列清空后再断言
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("asyncHandler", () => {
  it("正常执行时不调用 next", async () => {
    const { req, next } = makeReqNext();
    const res = makeRes();

    const handler = asyncHandler(async (_req, res) => {
      res.json({ ok: true });
    });

    handler(req, res, next);
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it("async 函数 throw 时，错误传递给 next", async () => {
    const { req, next } = makeReqNext();
    const res = makeRes();
    const err = new ValidationError("参数缺失");

    const handler = asyncHandler(async () => {
      throw err;
    });

    handler(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(err);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("同步 throw 被 Promise.resolve().then() 包裹后也能传给 next", async () => {
    const { req, next } = makeReqNext();
    const res = makeRes();

    const handler = asyncHandler((_req, _res) => {
      throw new NotFoundError("资源不存在");
    });

    handler(req, res, next);
    await flushPromises();

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});
