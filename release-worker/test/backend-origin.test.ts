import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const RATE_LIMITER = {
  idFromName: () => ({}) as DurableObjectId,
  get: () => ({
    fetch: async () => Response.json({ allowed: true, retry_after: 0 }),
  }),
};

function environment(originToken?: string) {
  return {
    BACKEND_ORIGIN: "https://backend.example",
    BACKEND_ORIGIN_TOKEN: originToken,
    PUBLIC_RELEASES_ENABLED: "true",
    PUBLIC_RELEASE_CANARY_IDS: "42",
    RENDERER_VERSION: "2",
    DISCOGS_NON_AFFILIATION_NOTICE: "Test notice",
    REPORT_ORIGIN_TOKEN: "report-token",
    REPORT_SOURCE_SALT: "report-source-salt",
    RATE_LIMITER,
  } as never;
}

function capturedHeaders(fetchMock: ReturnType<typeof vi.fn>): Headers {
  const [input, init] = fetchMock.mock.calls[0] ?? [];
  return input instanceof Request ? input.headers : new Headers(init?.headers);
}

describe("backend staging origin authentication", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [undefined, null],
    ["staging-origin-token", "staging-origin-token"],
  ])("sends the configured token on backend GET requests", async (configured, expected) => {
    const backendFetch = vi.fn(async () => Response.json({
      type: "about:blank",
      title: "Not found",
      status: 404,
      code: "release_not_found",
    }, { status: 404 }));
    vi.stubGlobal("fetch", backendFetch);

    await worker.fetch(
      new Request("https://myvinyls.app/release/42"),
      environment(configured),
      { waitUntil: vi.fn() } as unknown as ExecutionContext,
    );

    expect(capturedHeaders(backendFetch).get("x-public-release-origin-token")).toBe(expected);
  });

  it.each([
    [undefined, null],
    ["staging-origin-token", "staging-origin-token"],
  ])("sends the configured token on backend report requests", async (configured, expected) => {
    const backendFetch = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", backendFetch);
    const body = new URLSearchParams({
      category: "other",
      explanation: "A staging report with enough detail.",
    });

    await worker.fetch(
      new Request("https://myvinyls.app/release/42/report", {
        method: "POST",
        headers: {
          "CF-Connecting-IP": "192.0.2.42",
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://myvinyls.app",
        },
        body,
      }),
      environment(configured),
      {} as ExecutionContext,
    );

    expect(capturedHeaders(backendFetch).get("x-public-release-origin-token")).toBe(expected);
  });
});
