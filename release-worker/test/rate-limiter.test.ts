import { describe, expect, it } from "vitest";
import { ReleaseRateLimiter } from "../src/rate-limiter";

class MemoryStorage {
  private value: unknown;

  async get<T>(): Promise<T | undefined> {
    return this.value as T | undefined;
  }

  async put(_key: string, value: unknown): Promise<void> {
    this.value = value;
  }
}

function limiter(): ReleaseRateLimiter {
  return new ReleaseRateLimiter({ storage: new MemoryStorage() } as unknown as DurableObjectState);
}

async function decide(instance: ReleaseRateLimiter, input: object): Promise<{ allowed: boolean; retry_after: number }> {
  const response = await instance.fetch(new Request("https://rate.internal/release", {
    method: "POST",
    body: JSON.stringify(input),
  }));
  return response.json();
}

describe("ReleaseRateLimiter", () => {
  it("allows 60 requests per minute and rejects the next one", async () => {
    const instance = limiter();
    for (let count = 0; count < 60; count += 1) {
      expect((await decide(instance, { kind: "release", releaseId: "1", now: 1_000 })).allowed).toBe(true);
    }
    expect((await decide(instance, { kind: "release", releaseId: "1", now: 1_000 })).allowed).toBe(false);
  });

  it("rejects the twenty-first distinct release within ten minutes", async () => {
    const instance = limiter();
    for (let id = 1; id <= 20; id += 1) {
      expect((await decide(instance, { kind: "release", releaseId: String(id), now: 1_000 })).allowed).toBe(true);
    }
    expect((await decide(instance, { kind: "release", releaseId: "21", now: 1_000 })).allowed).toBe(false);
  });

  it("allows five reports per hour and rejects the sixth", async () => {
    const instance = limiter();
    for (let count = 0; count < 5; count += 1) {
      expect((await decide(instance, { kind: "report", now: 1_000 })).allowed).toBe(true);
    }
    expect((await decide(instance, { kind: "report", now: 1_000 })).allowed).toBe(false);
  });
});
