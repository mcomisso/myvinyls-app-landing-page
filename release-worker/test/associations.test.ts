import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index";

const DARK_PRODUCTION = {
  PUBLIC_RELEASES_ENABLED: "false",
  DISABLED_PASSTHROUGH: "true",
} as const;

describe("native app association documents", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serves the iOS association as JSON while Public Releases are dark", async () => {
    const originFetch = vi.fn();
    vi.stubGlobal("fetch", originFetch);

    const response = await worker.fetch(
      new Request("https://myvinyls.app/.well-known/apple-app-site-association"),
      DARK_PRODUCTION as never,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await response.json()).toMatchObject({
      applinks: {
        details: [{
          appIDs: ["382G4857JD.com.mcomisso.DiscogsClient"],
          components: expect.arrayContaining([
            expect.objectContaining({ "/": "/release/*" }),
            expect.objectContaining({ "/": "/record/*" }),
          ]),
        }],
      },
    });
    expect(originFetch).not.toHaveBeenCalled();
  });

  it("serves the Firebase beta Android association with its verified signer", async () => {
    const response = await worker.fetch(
      new Request("https://myvinyls.app/.well-known/assetlinks.json"),
      DARK_PRODUCTION as never,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await response.json()).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.mcsoftware.myvinyl",
          sha256_cert_fingerprints: [
            "42:E4:1F:A4:B1:F3:13:26:E8:5B:20:34:DE:7D:E1:17:8D:92:CA:DE:35:41:20:FC:6A:B0:84:7D:B4:C2:45:58",
          ],
        },
      },
    ]);
  });

  it("supports HEAD and rejects mutations", async () => {
    const head = await worker.fetch(
      new Request("https://myvinyls.app/.well-known/assetlinks.json", { method: "HEAD" }),
      DARK_PRODUCTION as never,
      {} as ExecutionContext,
    );
    const post = await worker.fetch(
      new Request("https://myvinyls.app/.well-known/assetlinks.json", { method: "POST" }),
      DARK_PRODUCTION as never,
      {} as ExecutionContext,
    );

    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    expect(post.status).toBe(405);
    expect(post.headers.get("allow")).toBe("GET, HEAD");
  });
});
