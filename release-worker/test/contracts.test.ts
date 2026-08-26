import { describe, expect, it } from "vitest";
import {
  isPublicReleaseCanaryAllowed,
  isPublicReleaseSnapshot,
  isValidDiscogsWebURL,
  MAX_RELEASE_ID,
  parseReleasePath,
  parseReportPath,
} from "../src/contracts";

describe("isPublicReleaseCanaryAllowed", () => {
  it("requires an explicit ID, or an explicit all-routes marker", () => {
    expect(isPublicReleaseCanaryAllowed(undefined, 42n)).toBe(false);
    expect(isPublicReleaseCanaryAllowed("", 42n)).toBe(false);
    expect(isPublicReleaseCanaryAllowed("42, 9223372036854775807", 42n)).toBe(true);
    expect(isPublicReleaseCanaryAllowed("42, 9223372036854775807", 43n)).toBe(false);
    expect(isPublicReleaseCanaryAllowed("*", 43n)).toBe(true);
    expect(isPublicReleaseCanaryAllowed("*,42", 43n)).toBe(false);
  });
});

describe("parseReleasePath", () => {
  it("accepts the canonical signed int64 path", () => {
    expect(parseReleasePath(new URL(`https://myvinyls.app/release/${MAX_RELEASE_ID}`))).toEqual({
      kind: "release",
      id: MAX_RELEASE_ID,
      canonicalPath: `/release/${MAX_RELEASE_ID}`,
      needsRedirect: false,
    });
  });

  it.each([
    "https://myvinyls.app/record/42",
    "https://myvinyls.app/release/0042/",
    "https://www.myvinyls.app/release/42?utm_source=test",
    "http://myvinyls.app/release/42",
  ])("canonicalizes %s", (value) => {
    expect(parseReleasePath(new URL(value))).toMatchObject({
      kind: "release",
      id: 42n,
      canonicalPath: "/release/42",
      needsRedirect: true,
    });
  });

  it.each(["0", "-1", "+1", "１２", "9223372036854775808", "1-slug", "1/extra"])("rejects invalid id %s", (id) => {
    expect(parseReleasePath(new URL(`https://myvinyls.app/release/${id}`))).toEqual({ kind: "not-found" });
  });
});

describe("parseReportPath", () => {
  it("accepts only a canonical positive signed int64 report route", () => {
    expect(parseReportPath(new URL("https://myvinyls.app/release/42/report"))).toEqual({
      kind: "report",
      id: 42n,
      canonicalPath: "/release/42/report",
    });
  });

  it.each(["0", "-1", "1-slug", "9223372036854775808"])("rejects invalid report id %s", (id) => {
    expect(parseReportPath(new URL(`https://myvinyls.app/release/${id}/report`))).toEqual({ kind: "not-found" });
  });
});

describe("isValidDiscogsWebURL", () => {
  it("accepts an exact Release URL with provider slug", () => {
    expect(isValidDiscogsWebURL("https://www.discogs.com/release/42-Release-Title", 42n)).toBe(true);
  });

  it.each([
    "https://api.discogs.com/releases/42",
    "https://discogs.com/release/42",
    "https://www.discogs.com/release/43",
    "https://www.discogs.com/release/42?source=test",
    "https://user@www.discogs.com/release/42",
  ])("rejects %s", (value) => {
    expect(isValidDiscogsWebURL(value, 42n)).toBe(false);
  });
});

describe("isPublicReleaseSnapshot", () => {
  const valid = {
    schema_version: 1,
    discogs_release_id: "9223372036854775807",
    discogs_web_url: "https://www.discogs.com/release/9223372036854775807-Title",
    provider_fetched_at: "2026-08-25T12:00:00Z",
    display_expires_at: "2026-08-25T18:00:00Z",
    title: "Title",
    artists: ["Artist"],
    year: null,
    country: null,
    formats: [],
    labels: [],
    tracklist: [],
    identifiers: [],
    genres: [],
    styles: [],
  };

  it("preserves signed int64 identity as a decimal string", () => {
    expect(isPublicReleaseSnapshot(valid, MAX_RELEASE_ID)).toBe(true);
  });

  it("rejects an unsafe JSON number identity and malformed nested data", () => {
    expect(isPublicReleaseSnapshot({ ...valid, discogs_release_id: Number(MAX_RELEASE_ID) }, MAX_RELEASE_ID)).toBe(false);
    expect(isPublicReleaseSnapshot({ ...valid, formats: [{ quantity: 0, name: "Vinyl", descriptions: [] }] }, MAX_RELEASE_ID)).toBe(false);
  });
});
