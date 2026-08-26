import { describe, expect, it } from "vitest";
import { negotiateLocale, SUPPORTED_LOCALES } from "../src/localization";

describe("Accept-Language negotiation", () => {
  it.each([
    ["de-DE,de;q=0.9,en;q=0.8", "de"],
    ["es-MX", "es"],
    ["fr-CA", "fr"],
    ["it-IT", "it"],
    ["ja-JP", "ja"],
    ["pt-BR", "pt"],
    ["zh-CN", "zh-CN"],
    ["zh-Hans", "zh-CN"],
  ])("matches %s to %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });

  it("uses quality then header order", () => {
    expect(negotiateLocale("de;q=0.5, fr;q=0.9, es;q=0.9")).toBe("fr");
  });

  it.each([null, "", "nl-NL", "zh-TW", "de;q=0", "garbage;q=wat", "*"])(
    "falls back deterministically to English for %s",
    (header) => {
      expect(negotiateLocale(header)).toBe("en");
    },
  );

  it("keeps the settled cache and purge locale set explicit", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "de", "es", "fr", "it", "ja", "pt", "zh-CN"]);
  });
});
