import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

describe("bound production dark mode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    "https://myvinyls.app/record/0042?campaign=test",
    "https://myvinyls.app/release/42/report",
  ])("returns a fail-closed 404 for %s without a same-zone subrequest", async (url) => {
    const originFetch = vi.fn(async (_request: Request) => new Response("existing origin", {
      status: 404,
      headers: { "X-Existing-Origin": "true" },
    }));
    vi.stubGlobal("fetch", originFetch);

    const response = await worker.fetch(
      new Request(url),
      {
        PUBLIC_RELEASES_ENABLED: "false",
        DISABLED_NOT_FOUND: "true",
      } as never,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("location")).toBeNull();
    expect(await response.text()).not.toContain('rel="canonical"');
    expect(originFetch).not.toHaveBeenCalled();
  });

  it("keeps authenticated cache purge reachable while public routes are dark", async () => {
    const originFetch = vi.fn(async (_request: Request) => new Response("existing origin", { status: 404 }));
    vi.stubGlobal("fetch", originFetch);

    const response = await worker.fetch(
      new Request("https://myvinyls.app/__internal/cache/purge", {
        method: "POST",
        headers: {
          Authorization: "Bearer purge-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discogs_release_id: "42" }),
      }),
      {
        PUBLIC_RELEASES_ENABLED: "false",
        DISABLED_NOT_FOUND: "true",
        PURGE_TOKEN: "purge-token",
        RENDERER_VERSION: "2",
      } as never,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(204);
    expect(originFetch).not.toHaveBeenCalled();
  });

  it.each([
    "https://myvinyls.app/release/43",
    "https://myvinyls.app/record/0043?campaign=test",
    "https://myvinyls.app/release/43/report",
  ])("does not expose a Release outside the explicit canary allowlist at %s", async (url) => {
    const originFetch = vi.fn(async (_request: Request) => new Response("unexpected", { status: 200 }));
    vi.stubGlobal("fetch", originFetch);

    const response = await worker.fetch(
      new Request(url, { redirect: "manual" }),
      {
        PUBLIC_RELEASES_ENABLED: "true",
        PUBLIC_RELEASE_CANARY_IDS: "42",
        DISCOGS_NON_AFFILIATION_NOTICE: "Test notice",
      } as never,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
    expect(await response.text()).not.toContain('rel="canonical"');
    expect(originFetch).not.toHaveBeenCalled();
  });
});
