import type { ProblemDetails, PublicReleaseSnapshot } from "./contracts";

const ATTRIBUTION_TEXT = "Data provided by Discogs";

export function renderReleasePage(
  snapshot: PublicReleaseSnapshot,
  canonicalURL: string,
  nonAffiliationNotice: string,
): string {
  const releaseId = BigInt(snapshot.discogs_release_id);
  const artist = snapshot.artists.filter(Boolean).join(", ");
  const heading = [artist, snapshot.title].filter(Boolean).join(" - ");
  const edition = [
    snapshot.year,
    snapshot.country,
    ...snapshot.formats.map(formatText),
  ].filter(Boolean);

  return documentShell({
    title: `${heading || `Release ${releaseId}`} | MyVinyl`,
    canonicalURL,
    body: `
      <header class="site-header"><a href="/" aria-label="MyVinyl home">MyVinyl</a></header>
      <main id="main" tabindex="-1">
        <section aria-labelledby="release-title" class="hero">
          <p class="eyebrow">Catalogue Release</p>
          <h1 id="release-title">${escapeHTML(heading || snapshot.title)}</h1>
          ${edition.length ? `<p class="edition">${edition.map(String).map(escapeHTML).join(" · ")}</p>` : ""}
          <p class="updated">Release data updated <time datetime="${escapeAttribute(snapshot.provider_fetched_at)}">${escapeHTML(formatDate(snapshot.provider_fetched_at))}</time></p>
          ${attribution(snapshot.discogs_web_url)}
        </section>
        ${renderPublishing(snapshot)}
        <nav class="handoffs" aria-label="Release destinations">
          <a class="primary" href="${escapeAttribute(canonicalURL)}">Open in MyVinyl</a>
          <a href="${escapeAttribute(snapshot.discogs_web_url)}" rel="noreferrer noopener">View on Discogs <span class="visually-hidden">external link</span></a>
          <a href="/get/">Get MyVinyl</a>
        </nav>
        ${renderTracklist(snapshot)}
        ${renderIdentifiers(snapshot)}
        ${renderGenres(snapshot)}
        <p><a href="${escapeAttribute(new URL(`/release/${releaseId}/report`, canonicalURL).toString())}">Report This Page</a></p>
      </main>
      <footer>
        <p lang="en">${escapeHTML(nonAffiliationNotice)}</p>
        <p><a href="/privacypolicy/">Privacy</a> · <a href="/terms/">Terms</a></p>
      </footer>`,
  });
}

export function renderProblemPage(problem: ProblemDetails, canonicalURL?: string): string {
  const copy = problemCopy(problem.status, problem.reason_code);
  const retry = problem.status === 503 || problem.status === 429;
  return documentShell({
    title: `${copy.heading} | MyVinyl`,
    body: `
      <header class="site-header"><a href="/">MyVinyl</a></header>
      <main id="main" tabindex="-1" aria-live="polite">
        <section class="recovery">
          <p class="eyebrow">Catalogue Release</p>
          <h1>${escapeHTML(copy.heading)}</h1>
          <p>${escapeHTML(copy.detail)}</p>
          <div class="handoffs">
            ${retry ? '<a class="primary" href="">Retry</a>' : ""}
            ${canonicalURL ? `<a href="${escapeAttribute(canonicalURL)}">Open in MyVinyl</a>` : ""}
            <a href="/">MyVinyl home</a>
          </div>
        </section>
      </main>`,
  });
}

export function renderReportPage(releaseId: bigint, state: "form" | "accepted" | "invalid" = "form"): string {
  const status = state === "accepted"
    ? "Thank you. Your report has been queued for human review."
    : state === "invalid"
      ? "Check the required fields and try again."
      : "Reports are reviewed by an authorized person and never suppress a page automatically.";
  return documentShell({
    title: `Report Release ${releaseId} | MyVinyl`,
    body: `
      <header class="site-header"><a href="/">MyVinyl</a></header>
      <main id="main" tabindex="-1">
        <section class="recovery">
          <p class="eyebrow">Catalogue Release</p>
          <h1>Report This Page</h1>
          <p role="status">${escapeHTML(status)}</p>
          ${state === "accepted" ? "" : `<form method="post" action="/release/${releaseId}/report">
            <label>Reason
              <select name="category" required>
                <option value="">Choose a reason</option>
                <option value="privacy_publicity">Privacy or publicity harm</option>
                <option value="copyright_trademark">Copyright or trademark claim</option>
                <option value="impersonation">Impersonation</option>
                <option value="malicious_link">Malicious link</option>
                <option value="inaccurate_rights">Inaccurate rights claim</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>What happened?
              <textarea name="explanation" required minlength="10" maxlength="1000"></textarea>
            </label>
            <label>Email for follow-up, optional
              <input name="contact_email" type="email" maxlength="254" autocomplete="email">
            </label>
            <label class="check"><input name="permission_to_follow_up" type="checkbox" value="true"> MyVinyl may contact me about this report</label>
            <button class="primary" type="submit">Submit report</button>
          </form>`}
          <p><a href="/release/${releaseId}">Back to Release</a></p>
        </section>
      </main>`,
  });
}

function documentShell(input: { title: string; canonicalURL?: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,follow,noarchive,nosnippet">
  <meta name="referrer" content="no-referrer">
  ${input.canonicalURL ? `<link rel="canonical" href="${escapeAttribute(input.canonicalURL)}">` : ""}
  <title>${escapeHTML(input.title)}</title>
  <style>${styles}</style>
</head>
<body>
  <a class="skip" href="#main">Skip to release details</a>
  ${input.body}
</body>
</html>`;
}

function renderPublishing(snapshot: PublicReleaseSnapshot): string {
  if (!snapshot.labels.length) return "";
  const items = snapshot.labels
    .map((label) => `<li>${escapeHTML([label.name, label.catalog_number].filter(Boolean).join(" · "))}</li>`)
    .join("");
  return `<section><h2>Publishing</h2><ul>${items}</ul>${attribution(snapshot.discogs_web_url)}</section>`;
}

function renderTracklist(snapshot: PublicReleaseSnapshot): string {
  if (!snapshot.tracklist.length) return "";
  const rows = snapshot.tracklist.map((track) => `<li><span>${escapeHTML(track.position)}</span> <strong>${escapeHTML(track.title)}</strong>${track.duration ? ` <span>${escapeHTML(track.duration)}</span>` : ""}</li>`).join("");
  return `<section><h2>Tracklist</h2><ol class="tracklist">${rows}</ol>${attribution(snapshot.discogs_web_url)}</section>`;
}

function renderIdentifiers(snapshot: PublicReleaseSnapshot): string {
  if (!snapshot.identifiers.length) return "";
  const items = snapshot.identifiers.map((identifier) => `<li><strong>${escapeHTML(identifier.type)}</strong> ${escapeHTML(identifier.value)}</li>`).join("");
  return `<section><details><summary>Release identifiers</summary><ul>${items}</ul>${attribution(snapshot.discogs_web_url)}</details></section>`;
}

function renderGenres(snapshot: PublicReleaseSnapshot): string {
  const values = [...snapshot.genres, ...snapshot.styles];
  if (!values.length) return "";
  return `<section><h2>Genres and styles</h2><p>${values.map(escapeHTML).join(" · ")}</p>${attribution(snapshot.discogs_web_url)}</section>`;
}

function attribution(url: string): string {
  return `<p class="attribution"><a href="${escapeAttribute(url)}">${ATTRIBUTION_TEXT}</a>.</p>`;
}

function formatText(format: PublicReleaseSnapshot["formats"][number]): string {
  return [format.quantity > 1 ? `${format.quantity} x ${format.name}` : format.name, ...format.descriptions]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}

function problemCopy(status: number, reason?: string): { heading: string; detail: string } {
  if (status === 404) return { heading: "Release not found", detail: "We couldn't find a release for this link." };
  if (status === 410) return { heading: "Release no longer available", detail: "This release is no longer available." };
  if (status === 403) return { heading: "Release Page Unavailable", detail: "This release page is unavailable." };
  if (reason === "snapshot_expired") return { heading: "Release details temporarily unavailable", detail: "We couldn't refresh this release within the required freshness window." };
  if (status === 429) return { heading: "Release details temporarily unavailable", detail: "The release data service is busy. Please try again shortly." };
  return { heading: "Release details temporarily unavailable", detail: "We couldn't load this release right now. Please try again." };
}

export function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function escapeAttribute(value: string): string {
  return escapeHTML(value);
}

const styles = `
:root { color-scheme: light; --canvas:#d8d7d7; --paper:#f7f7f7; --ink:#292626; --muted:#626060; --line:#aaa7a7; --focus:#111; }
* { box-sizing: border-box; }
body { margin:0; background:var(--paper); color:var(--ink); font:1rem/1.55 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; overflow-wrap:anywhere; }
a { color:inherit; text-underline-offset:.2em; }
a:focus-visible, summary:focus-visible { outline:3px solid var(--focus); outline-offset:4px; }
.skip { position:absolute; left:1rem; top:-5rem; padding:.75rem 1rem; background:#000; color:#fff; z-index:2; }
.skip:focus { top:1rem; }
.site-header, main, footer { width:min(100% - 2rem, 46rem); margin-inline:auto; }
.site-header { padding-block:1.5rem; font-weight:800; }
main { min-height:65vh; }
.hero { padding:clamp(2rem,8vw,6rem) 0 2rem; }
.eyebrow { letter-spacing:.12em; text-transform:uppercase; font-size:.78rem; font-weight:700; }
h1 { max-width:16ch; font-size:clamp(2.4rem,10vw,6.5rem); line-height:.96; letter-spacing:-.05em; margin:.25em 0; }
h2 { margin-top:2.5rem; }
.edition { font-size:1.15rem; }
.updated,.attribution { color:var(--muted); font-size:.9rem; }
.handoffs { display:flex; flex-wrap:wrap; gap:.75rem; margin:2rem 0; }
.handoffs a { min-height:44px; display:inline-flex; align-items:center; padding:.7rem 1rem; border:1px solid var(--ink); border-radius:999px; }
.handoffs .primary { background:var(--ink); color:#fff; }
ul,ol { padding-left:1.25rem; }
.tracklist li { display:grid; grid-template-columns:minmax(2.5rem,auto) 1fr auto; gap:.75rem; padding:.55rem 0; border-bottom:1px solid var(--line); }
summary { min-height:44px; display:flex; align-items:center; cursor:pointer; font-weight:700; }
form { display:grid; gap:1.25rem; max-width:38rem; }
label { display:grid; gap:.35rem; font-weight:700; }
label.check { grid-template-columns:auto 1fr; align-items:start; font-weight:400; }
input,select,textarea,button { font:inherit; min-height:44px; padding:.65rem; border:1px solid var(--ink); border-radius:.35rem; background:#fff; color:var(--ink); }
textarea { min-height:9rem; resize:vertical; }
button.primary { justify-self:start; background:var(--ink); color:#fff; cursor:pointer; }
footer { border-top:1px solid var(--line); margin-top:4rem; padding:2rem 0 4rem; }
.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
@media (max-width:320px) { .handoffs { flex-direction:column; } .handoffs a { width:100%; justify-content:center; } .tracklist li { grid-template-columns:2.5rem 1fr; } .tracklist li span:last-child { grid-column:2; } }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after { scroll-behavior:auto!important; transition:none!important; animation:none!important; } }
`;
