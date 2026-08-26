import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

async function hmac(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function environment(idFromName: ReturnType<typeof vi.fn>) {
  return {
    BACKEND_ORIGIN: "https://backend.example",
    PUBLIC_RELEASES_ENABLED: "true",
    PUBLIC_RELEASE_CANARY_IDS: "42",
    RENDERER_VERSION: "2",
    DISCOGS_NON_AFFILIATION_NOTICE: "Test notice",
    RATE_LIMIT_SOURCE_SALT: "dedicated-rate-limit-salt",
    RATE_LIMITER: {
      idFromName,
      get: () => ({
        fetch: async () => Response.json({ allowed: true, retry_after: 0 }),
      }),
    },
  } as never;
}

describe("Worker privacy boundary", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses a salted HMAC partition and sends only contract headers to the backend", async () => {
    const idFromName = vi.fn(() => ({}) as DurableObjectId);
    const backendFetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
      type: "about:blank",
      title: "Not found",
      status: 404,
      code: "release_not_found",
    }, { status: 404 }));
    vi.stubGlobal("fetch", backendFetch);

    await worker.fetch(
      new Request("https://myvinyls.app/release/42", {
        headers: {
          Authorization: "Bearer browser-token",
          Cookie: "account=private",
          "CF-Connecting-IP": "192.0.2.42",
          "CF-Ray": "browser-ray-id",
          Referer: "https://private.example/account/7",
          "X-Account-ID": "7",
          "X-Release-Context": "private-collection",
        },
      }),
      environment(idFromName),
      { waitUntil: vi.fn() } as unknown as ExecutionContext,
    );

    expect(idFromName).toHaveBeenCalledOnce();
    expect(idFromName).toHaveBeenCalledWith(await hmac("192.0.2.42", "dedicated-rate-limit-salt"));
    expect(idFromName).not.toHaveBeenCalledWith("192.0.2.42");

    expect(backendFetch).toHaveBeenCalledOnce();
    const [input, init] = backendFetch.mock.calls[0];
    expect(input).toBe("https://backend.example/v1/public/releases/42");
    const headers = new Headers(init?.headers);
    expect([...headers.keys()].sort()).toEqual(["accept", "x-request-id"]);
    expect(headers.get("x-request-id")).not.toBe("browser-ray-id");
  });

  it("fails closed before choosing a Durable Object when the salt is absent", async () => {
    const idFromName = vi.fn(() => ({}) as DurableObjectId);
    const backendFetch = vi.fn();
    vi.stubGlobal("fetch", backendFetch);
    const env = environment(idFromName) as { RATE_LIMIT_SOURCE_SALT?: string };
    delete env.RATE_LIMIT_SOURCE_SALT;

    const response = await worker.fetch(
      new Request("https://myvinyls.app/release/42", {
        headers: { "CF-Connecting-IP": "192.0.2.42" },
      }),
      env as never,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(idFromName).not.toHaveBeenCalled();
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("canonicalizes away a browser query without sending it to the backend", async () => {
    const idFromName = vi.fn(() => ({}) as DurableObjectId);
    const backendFetch = vi.fn();
    vi.stubGlobal("fetch", backendFetch);

    const response = await worker.fetch(
      new Request("https://myvinyls.app/release/42?campaign=private", {
        redirect: "manual",
        headers: { "CF-Connecting-IP": "192.0.2.42" },
      }),
      environment(idFromName),
      {} as ExecutionContext,
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://myvinyls.app/release/42");
    expect(backendFetch).not.toHaveBeenCalled();
  });
});
