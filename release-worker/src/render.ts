import type { ProblemDetails, PublicReleaseSnapshot } from "./contracts";
import { copy, type SupportedLocale } from "./localization";

const ATTRIBUTION_TEXT = "Data provided by Discogs";

export function renderReleasePage(
  snapshot: PublicReleaseSnapshot,
  canonicalURL: string,
  nonAffiliationNotice: string,
  locale: SupportedLocale = "en",
  routeOrigin?: string,
): string {
  const text = copy[locale];
  const releaseId = BigInt(snapshot.discogs_release_id);
  const artist = snapshot.artists.filter(Boolean).join(", ");
  const heading = [artist, snapshot.title].filter(Boolean).join(" - ");
  const edition = [
    snapshot.year,
    snapshot.country,
    ...snapshot.formats.map(formatText),
  ].filter(Boolean);

  return documentShell({
    locale,
    title: `${heading || `${text.releaseFallback} ${releaseId}`} | MyVinyl`,
    canonicalURL,
    body: `
      <header class="site-header"><a href="/" aria-label="${escapeAttribute(text.homeLabel)}">MyVinyl</a></header>
      <main id="main" tabindex="-1">
        <section aria-labelledby="release-title" class="hero">
          <p class="eyebrow">${escapeHTML(text.catalogueRelease)}</p>
          <h1 id="release-title">${escapeHTML(heading || snapshot.title)}</h1>
          ${edition.length ? `<p class="edition">${edition.map(String).map(escapeHTML).join(" · ")}</p>` : ""}
          <p class="updated">${escapeHTML(text.updated)} <time datetime="${escapeAttribute(snapshot.provider_fetched_at)}">${escapeHTML(formatDate(snapshot.provider_fetched_at, locale))}</time></p>
          ${attribution(snapshot.discogs_web_url)}
        </section>
        ${renderPublishing(snapshot, locale)}
        <nav class="handoffs" aria-label="${escapeAttribute(text.releaseDestinations)}">
          <a class="primary" href="${escapeAttribute(canonicalURL)}">${escapeHTML(text.openInMyVinyl)}</a>
          <a href="${escapeAttribute(snapshot.discogs_web_url)}" rel="noreferrer noopener">${escapeHTML(text.viewOnDiscogs)} <span class="visually-hidden">${escapeHTML(text.externalLink)}</span></a>
          <a href="/get/">${escapeHTML(text.getMyVinyl)}</a>
        </nav>
        ${renderTracklist(snapshot, locale)}
        ${renderIdentifiers(snapshot, locale)}
        ${renderGenres(snapshot, locale)}
        <p><a href="${escapeAttribute(new URL(`/release/${releaseId}/report`, routeOrigin ?? canonicalURL).toString())}">${escapeHTML(text.reportThisPage)}</a></p>
      </main>
      <footer>
        <p lang="en">${escapeHTML(nonAffiliationNotice)}</p>
        <p><a href="/privacypolicy/">${escapeHTML(text.privacy)}</a> · <a href="/terms/">${escapeHTML(text.terms)}</a></p>
      </footer>`,
  });
}

export function renderProblemPage(problem: ProblemDetails, canonicalURL?: string, locale: SupportedLocale = "en"): string {
  const text = copy[locale];
  const problemText = problemCopy(problem.status, problem.reason_code, locale);
  const retry = problem.status === 503 || problem.status === 429;
  return documentShell({
    locale,
    title: `${problemText.heading} | MyVinyl`,
    body: `
      <header class="site-header"><a href="/">MyVinyl</a></header>
      <main id="main" tabindex="-1" aria-live="polite">
        <section class="recovery">
          <p class="eyebrow">${escapeHTML(text.catalogueRelease)}</p>
          <h1>${escapeHTML(problemText.heading)}</h1>
          <p>${escapeHTML(problemText.detail)}</p>
          <div class="handoffs">
            ${retry ? `<a class="primary" href="">${escapeHTML(text.retry)}</a>` : ""}
            ${canonicalURL ? `<a href="${escapeAttribute(canonicalURL)}">${escapeHTML(text.openInMyVinyl)}</a>` : ""}
            <a href="/">${escapeHTML(text.myVinylHome)}</a>
          </div>
        </section>
      </main>`,
  });
}

export function renderReportPage(
  releaseId: bigint,
  state: "form" | "accepted" | "invalid" = "form",
  locale: SupportedLocale = "en",
): string {
  const text = copy[locale];
  const status = state === "accepted"
    ? text.reportQueued
    : state === "invalid"
      ? text.reportInvalid
      : text.reportReviewNotice;
  return documentShell({
    locale,
    title: `${text.reportTitle} ${releaseId} | MyVinyl`,
    body: `
      <header class="site-header"><a href="/">MyVinyl</a></header>
      <main id="main" tabindex="-1">
        <section class="recovery">
          <p class="eyebrow">${escapeHTML(text.catalogueRelease)}</p>
          <h1>${escapeHTML(text.reportThisPage)}</h1>
          <p role="status">${escapeHTML(status)}</p>
          ${state === "accepted" ? "" : `<form method="post" action="/release/${releaseId}/report">
            <label>${escapeHTML(text.reason)}
              <select name="category" required>
                <option value="">${escapeHTML(text.chooseReason)}</option>
                <option value="privacy_publicity">${escapeHTML(text.privacyPublicity)}</option>
                <option value="copyright_trademark">${escapeHTML(text.copyrightTrademark)}</option>
                <option value="impersonation">${escapeHTML(text.impersonation)}</option>
                <option value="malicious_link">${escapeHTML(text.maliciousLink)}</option>
                <option value="inaccurate_rights">${escapeHTML(text.inaccurateRights)}</option>
                <option value="other">${escapeHTML(text.other)}</option>
              </select>
            </label>
            <label>${escapeHTML(text.whatHappened)}
              <textarea name="explanation" required minlength="10" maxlength="1000"></textarea>
            </label>
            <label>${escapeHTML(text.followUpEmail)}
              <input name="contact_email" type="email" maxlength="254" autocomplete="email">
            </label>
            <label class="check"><input name="permission_to_follow_up" type="checkbox" value="true"> ${escapeHTML(text.followUpPermission)}</label>
            <button class="primary" type="submit">${escapeHTML(text.submitReport)}</button>
          </form>`}
          <p><a href="/release/${releaseId}">${escapeHTML(text.backToRelease)}</a></p>
        </section>
      </main>`,
  });
}

function documentShell(input: { locale: SupportedLocale; title: string; canonicalURL?: string; body: string }): string {
  return `<!doctype html>
<html lang="${input.locale}">
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
  <a class="skip" href="#main">${escapeHTML(copy[input.locale].skipToDetails)}</a>
  ${input.body}
</body>
</html>`;
}

function renderPublishing(snapshot: PublicReleaseSnapshot, locale: SupportedLocale): string {
  if (!snapshot.labels.length) return "";
  const items = snapshot.labels
    .map((label) => `<li>${escapeHTML([label.name, label.catalog_number].filter(Boolean).join(" · "))}</li>`)
    .join("");
  return `<section><h2>${escapeHTML(copy[locale].publishing)}</h2><ul>${items}</ul>${attribution(snapshot.discogs_web_url)}</section>`;
}

function renderTracklist(snapshot: PublicReleaseSnapshot, locale: SupportedLocale): string {
  if (!snapshot.tracklist.length) return "";
  const rows = snapshot.tracklist.map((track) => `<li><span>${escapeHTML(track.position)}</span> <strong>${escapeHTML(track.title)}</strong>${track.duration ? ` <span>${escapeHTML(track.duration)}</span>` : ""}</li>`).join("");
  return `<section><h2>${escapeHTML(copy[locale].tracklist)}</h2><ol class="tracklist">${rows}</ol>${attribution(snapshot.discogs_web_url)}</section>`;
}

function renderIdentifiers(snapshot: PublicReleaseSnapshot, locale: SupportedLocale): string {
  if (!snapshot.identifiers.length) return "";
  const items = snapshot.identifiers.map((identifier) => `<li><strong>${escapeHTML(identifier.type)}</strong> ${escapeHTML(identifier.value)}</li>`).join("");
  return `<section><details><summary>${escapeHTML(copy[locale].releaseIdentifiers)}</summary><ul>${items}</ul>${attribution(snapshot.discogs_web_url)}</details></section>`;
}

function renderGenres(snapshot: PublicReleaseSnapshot, locale: SupportedLocale): string {
  const values = [...snapshot.genres, ...snapshot.styles];
  if (!values.length) return "";
  return `<section><h2>${escapeHTML(copy[locale].genresAndStyles)}</h2><p>${values.map(escapeHTML).join(" · ")}</p>${attribution(snapshot.discogs_web_url)}</section>`;
}

function attribution(url: string): string {
  return `<p class="attribution"><a href="${escapeAttribute(url)}">${ATTRIBUTION_TEXT}</a>.</p>`;
}

function formatText(format: PublicReleaseSnapshot["formats"][number]): string {
  return [format.quantity > 1 ? `${format.quantity} x ${format.name}` : format.name, ...format.descriptions]
    .filter(Boolean)
    .join(", ");
}

function formatDate(value: string, locale: SupportedLocale): string {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);
}

function problemCopy(status: number, reason: string | undefined, locale: SupportedLocale): { heading: string; detail: string } {
  const text = copy[locale];
  if (status === 404) return { heading: text.notFoundHeading, detail: text.notFoundDetail };
  if (status === 410) return { heading: text.goneHeading, detail: text.goneDetail };
  if (status === 403) return { heading: text.unavailableHeading, detail: text.unavailableDetail };
  if (reason === "snapshot_expired") return { heading: text.unavailableHeading, detail: text.freshnessDetail };
  if (status === 429) return { heading: text.unavailableHeading, detail: text.busyDetail };
  return { heading: text.unavailableHeading, detail: text.unavailableDetail };
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
