import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { cachedBrowserResponse, conditionalResponse, releaseCacheKey } from "../src/index";

describe("Public Release Worker routes", () => {
  it("does not canonicalize aliases while the Worker is disabled", async () => {
    const response = await SELF.fetch("https://myvinyls.app/record/0042/?campaign=test", { redirect: "manual" });
    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("fails closed while the external-clearance gate is disabled", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/42", {
      headers: { "Accept-Language": "es-MX,es;q=0.9" },
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-language")).toBe("es");
    expect(response.headers.get("vary")).toBe("Accept-Language");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    const html = await response.text();
    expect(html).toContain("Detalles de la edición no disponibles temporalmente");
    expect(html).not.toContain('rel="canonical"');
  });

  it("keeps the canonical staging path on staging for dark runtime proof", async () => {
    const response = await SELF.fetch("https://myvinyl-public-release-staging.teomatteo89.workers.dev/release/42");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain('rel="canonical"');
  });

  it("keeps staging aliases dark while the Worker is disabled", async () => {
    const response = await SELF.fetch(
      "https://myvinyl-public-release-staging.teomatteo89.workers.dev/record/0042?campaign=test",
      { redirect: "manual" },
    );
    expect(response.status).toBe(503);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not expose the anonymous report form while the Worker is disabled", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/42/report", {
      headers: { "Accept-Language": "zh-CN" },
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-language")).toBe("zh-CN");
    expect(response.headers.get("vary")).toBe("Accept-Language");
    expect(await response.text()).not.toContain("举报此页面");
  });

  it("does not expose identifier validity while the Worker is disabled", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/9223372036854775808");
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('rel="canonical"');
  });
});

describe("localized edge cache keys", () => {
  it("separates locale variants for one release and renderer", () => {
    const english = releaseCacheKey("/release/42", "en", "2");
    const german = releaseCacheKey("/release/42", "de", "2");
    expect(english.url).not.toBe(german.url);
    expect(english.url).toContain("locale=en");
    expect(german.url).toContain("locale=de");
  });
});

describe("conditional responses", () => {
  it("restores the private browser policy on a cached response", async () => {
    const request = new Request("https://myvinyls.app/release/42");
    const cached = new Response("cached", { headers: { "Cache-Control": "public, max-age=300" } });

    const response = cachedBrowserResponse(request, cached);

    expect(response.headers.get("cache-control")).toBe("private, max-age=60, must-revalidate");
    expect(await response.text()).toBe("cached");
    expect(cached.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("returns 304 for an exact ETag without leaking a body", async () => {
    const request = new Request("https://myvinyls.app/release/42", { headers: { "If-None-Match": '"snapshot-42"' } });
    const response = conditionalResponse(request, new Response("private body", { headers: { ETag: '"snapshot-42"' } }));
    expect(response.status).toBe(304);
    expect(await response.text()).toBe("");
  });

  it("preserves a response when the validator differs", async () => {
    const request = new Request("https://myvinyls.app/release/42", { headers: { "If-None-Match": '"old"' } });
    const response = conditionalResponse(request, new Response("current", { headers: { ETag: '"new"' } }));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("current");
  });
});
