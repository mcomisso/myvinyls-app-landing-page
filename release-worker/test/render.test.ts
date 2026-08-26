import { describe, expect, it } from "vitest";
import type { PublicReleaseSnapshot } from "../src/contracts";
import { renderProblemPage, renderReleasePage, renderReportPage } from "../src/render";

const snapshot: PublicReleaseSnapshot = {
  schema_version: 1,
  discogs_release_id: "42",
  discogs_web_url: "https://www.discogs.com/release/42-Kind-of-Blue",
  provider_fetched_at: "2026-08-25T12:00:00Z",
  display_expires_at: "2026-08-25T18:00:00Z",
  title: "Kind <of> Blue",
  artists: ["Miles & Davis"],
  year: 1959,
  country: "US",
  formats: [{ quantity: 1, name: "Vinyl", descriptions: ["LP", "Mono"] }],
  labels: [{ name: "Columbia", catalog_number: "CL 1355" }],
  tracklist: [{ position: "A1", title: "So What", duration: "9:22" }],
  identifiers: [{ type: "Matrix / Runout", value: "XLP 47324" }],
  genres: ["Jazz"],
  styles: ["Modal"],
};

describe("renderReleasePage", () => {
  it("renders the settled hierarchy and escapes provider text", () => {
    const html = renderReleasePage(snapshot, "https://myvinyls.app/release/42", "Required notice");
    expect(html).toContain("Miles &amp; Davis - Kind &lt;of&gt; Blue");
    expect(html).toContain("Open in MyVinyl");
    expect(html).toContain("View on Discogs");
    expect(html).toContain("Data provided by Discogs");
    expect(html).toContain("Required notice");
    expect(html).not.toContain("og:image");
    expect(html).not.toContain("analytics");
  });
});

describe("renderProblemPage", () => {
  it("does not declare a Release canonical for not found", () => {
    const html = renderProblemPage({ type: "about:blank", title: "Not found", status: 404 });
    expect(html).toContain("Release not found");
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain("View on Discogs");
  });

  it("keeps the canonical app handoff for temporary recovery", () => {
    const html = renderProblemPage(
      { type: "about:blank", title: "Expired", status: 503, reason_code: "snapshot_expired" },
      "https://myvinyls.app/release/42",
    );
    expect(html).toContain("required freshness window");
    expect(html).toContain("Open in MyVinyl");
    expect(html).not.toContain("View on Discogs");
    expect(html).not.toContain('rel="canonical"');
  });
});

describe("renderReportPage", () => {
  it("renders the settled anonymous report fields without uploads", () => {
    const html = renderReportPage(42n);
    expect(html).toContain('name="category"');
    expect(html).toContain('name="explanation"');
    expect(html).toContain('name="contact_email"');
    expect(html).toContain('name="permission_to_follow_up"');
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain('rel="canonical"');
  });
});
