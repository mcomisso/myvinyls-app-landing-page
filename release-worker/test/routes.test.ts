import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Public Release Worker routes", () => {
  it("permanently canonicalizes aliases before the disabled content gate", async () => {
    const response = await SELF.fetch("https://myvinyls.app/record/0042/?campaign=test", { redirect: "manual" });
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://myvinyls.app/release/42");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("fails closed while the external-clearance gate is disabled", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/42");
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    const html = await response.text();
    expect(html).toContain("Release details temporarily unavailable");
    expect(html).not.toContain('rel="canonical"');
  });

  it("serves the anonymous report form without enabling Release content", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/42/report");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toContain("Report This Page");
  });

  it("rejects invalid identifiers without a canonical tag", async () => {
    const response = await SELF.fetch("https://myvinyls.app/release/9223372036854775808");
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('rel="canonical"');
  });
});
