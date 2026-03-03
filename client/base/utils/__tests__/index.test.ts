import { describe, expect, it, vi, afterEach } from "vitest";
import { randomUUID } from "../index";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUIDv4(s: string): boolean {
  return UUID_V4_REGEX.test(s) && s.length === 36;
}

describe("randomUUID", () => {
  const originalCrypto = globalThis.crypto;

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(globalThis, "crypto", {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it("返回符合 UUID v4 格式的字符串", () => {
    const uuid = randomUUID();
    expect(isValidUUIDv4(uuid)).toBe(true);
    expect(uuid).toHaveLength(36);
    expect(uuid[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(uuid[19].toLowerCase());
  });

  it("多次调用返回不重复的值", () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) {
      set.add(randomUUID());
    }
    expect(set.size).toBe(100);
  });

  it("crypto.randomUUID 可用时优先使用原生 API", () => {
    const mockUUID = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const mockRandomUUID = vi.fn().mockReturnValue(mockUUID);

    vi.stubGlobal("crypto", {
      ...originalCrypto,
      randomUUID: mockRandomUUID,
    });

    const result = randomUUID();

    expect(result).toBe(mockUUID);
    expect(mockRandomUUID).toHaveBeenCalled();
  });

  it("crypto.randomUUID 不可用但 getRandomValues 可用时走 getRandomValues 分支", () => {
    vi.stubGlobal("crypto", {
      randomUUID: undefined,
      getRandomValues: (buf: Uint8Array) => {
        for (let i = 0; i < buf.length; i++) {
          buf[i] = 0x42;
        }
        return buf;
      },
    });

    const result = randomUUID();

    expect(isValidUUIDv4(result)).toBe(true);
  });

  it("crypto 和 getRandomValues 均不可用时走 Math.random 兜底", () => {
    vi.stubGlobal("crypto", undefined);

    const result = randomUUID();

    expect(isValidUUIDv4(result)).toBe(true);
  });
});
