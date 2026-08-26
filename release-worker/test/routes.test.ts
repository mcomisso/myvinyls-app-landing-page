import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { conditionalResponse, releaseCacheKey } from "../src/index";

describe("Public Release Worker routes", () => {
  it("permanently canonicalizes aliases before the disabled content gate", async () => {
    const response = await SELF.fetch("https://myvinyls.app/record/0042/?campaign=test", { redirect: "manual" });
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://myvinyls.app/release/42");
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

  it("serves the anonymous report form without enabling Release content", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/42/report", {
      headers: { "Accept-Language": "zh-CN" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-language")).toBe("zh-CN");
    expect(response.headers.get("vary")).toBe("Accept-Language");
    expect(await response.text()).toContain("举报此页面");
  });

  it("rejects invalid identifiers without a canonical tag", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/9223372036854775808");
    expect(response.status).toBe(404);
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
