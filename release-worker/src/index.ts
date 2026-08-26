import {
  isPublicReleaseCanaryAllowed,
  isPublicReleaseSnapshot,
  parseReleasePath,
  parseReportPath,
  type ProblemDetails,
} from "./contracts";
import { negotiateLocale, SUPPORTED_LOCALES, type SupportedLocale } from "./localization";
import { ReleaseRateLimiter } from "./rate-limiter";
import { renderProblemPage, renderReleasePage, renderReportPage } from "./render";

export { ReleaseRateLimiter };

interface Env {
  BACKEND_ORIGIN: string;
  BACKEND_ORIGIN_TOKEN?: string;
  PUBLIC_RELEASES_ENABLED: string;
  PUBLIC_RELEASE_CANARY_IDS?: string;
  DISABLED_PASSTHROUGH?: string;
  RENDERER_VERSION: string;
  DISCOGS_NON_AFFILIATION_NOTICE?: string;
  PURGE_TOKEN?: string;
  REPORT_ORIGIN_TOKEN?: string;
  REPORT_SOURCE_SALT?: string;
  STAGING_PREVIEW_HOST?: string;
  RATE_LIMITER: DurableObjectNamespace;
}

interface RateDecision {
  allowed: boolean;
  retry_after: number;
}

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const locale = negotiateLocale(request.headers.get("accept-language"));
    if (url.pathname === "/__internal/cache/purge") return purgeRequest(request, env);
    if (env.PUBLIC_RELEASES_ENABLED !== "true") {
      if (env.DISABLED_PASSTHROUGH === "true") return fetch(request);
      return problemResponse(503, "release_pages_disabled", undefined, 300, locale);
    }

    const report = parseReportPath(url);
    if (report.kind === "report") {
      if (!isPublicReleaseCanaryAllowed(env.PUBLIC_RELEASE_CANARY_IDS, report.id)) {
        return problemResponse(404, "not_found", undefined, undefined, locale);
      }
      return reportRequest(request, env, report.id, locale);
    }

    const parsed = parseReleasePath(url);
    if (parsed.kind === "not-found") return problemResponse(404, "not_found", undefined, undefined, locale);
    if (!isPublicReleaseCanaryAllowed(env.PUBLIC_RELEASE_CANARY_IDS, parsed.id)) {
      return problemResponse(404, "not_found", undefined, undefined, locale);
    }

    const rate = await checkRate(request, env, "release", parsed.id.toString());
    if (!rate.allowed) return problemResponse(429, "rate_limited", undefined, rate.retry_after, locale);

    const canonicalURL = `https://myvinyls.app${parsed.canonicalPath}`;
    const isStagingPreview = url.hostname === env.STAGING_PREVIEW_HOST;
    if (parsed.needsRedirect) {
      const previewPathIsCanonical = isStagingPreview &&
        url.pathname === parsed.canonicalPath &&
        url.search.length === 0;
      if (!previewPathIsCanonical) {
        const location = isStagingPreview ? `${url.origin}${parsed.canonicalPath}` : canonicalURL;
        return new Response(null, {
          status: 308,
          headers: securityHeaders({ Location: location, "Cache-Control": "public, max-age=31536000, immutable" }),
        });
      }
    }

    if (isVerifiedCrawler(request)) return problemResponse(403, "crawler_denied", undefined, undefined, locale);
    if (!env.DISCOGS_NON_AFFILIATION_NOTICE) {
      return problemResponse(503, "release_pages_disabled", canonicalURL, 300, locale);
    }

    const cacheKey = releaseCacheKey(parsed.canonicalPath, locale, env.RENDERER_VERSION);
    const cached = await caches.default.match(cacheKey);
    if (cached) return cachedBrowserResponse(request, cached);

    const traceId = request.headers.get("cf-ray") ?? crypto.randomUUID();
    const backendResponse = await fetch(`${env.BACKEND_ORIGIN}/v1/public/releases/${parsed.id}`, {
      headers: {
        Accept: "application/json",
        "X-Request-ID": traceId,
        ...backendOriginHeaders(env),
      },
    });

    if (backendResponse.status !== 200) {
      const problem = await readProblem(backendResponse);
      return problemResponse(
        normalizeStatus(backendResponse.status),
        problem.reason_code ?? problem.code ?? "temporary_failure",
        canonicalURL,
        retryAfter(backendResponse),
        locale,
      );
    }

    const snapshot: unknown = await backendResponse.json();
    if (!isPublicReleaseSnapshot(snapshot, parsed.id)) return problemResponse(503, "invalid_snapshot", canonicalURL, 60, locale);

    const expiry = Date.parse(snapshot.display_expires_at);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      return problemResponse(503, "snapshot_expired", canonicalURL, 60, locale);
    }

    const ttl = Math.max(1, Math.min(300, Math.floor((expiry - Date.now()) / 1000)));
    const response = htmlResponse(renderReleasePage(
      snapshot,
      canonicalURL,
      env.DISCOGS_NON_AFFILIATION_NOTICE,
      locale,
      isStagingPreview ? url.origin : undefined,
    ), 200, {
      "Cache-Control": `private, max-age=60, must-revalidate`,
      "CDN-Cache-Control": `public, max-age=${ttl}`,
      ETag: localizedETag(backendResponse.headers.get("etag"), env.RENDERER_VERSION, parsed.id, locale),
    }, locale);

    const edgeResponse = response.clone();
    edgeResponse.headers.set("Cache-Control", `public, max-age=${ttl}`);
    context.waitUntil(caches.default.put(cacheKey, edgeResponse));
    return conditionalResponse(request, response);
  },
} satisfies ExportedHandler<Env>;

function backendOriginHeaders(env: Env): Record<string, string> {
  return env.BACKEND_ORIGIN_TOKEN
    ? { "X-Public-Release-Origin-Token": env.BACKEND_ORIGIN_TOKEN }
    : {};
}

async function checkRate(request: Request, env: Env, kind: "release" | "report", releaseId?: string): Promise<RateDecision> {
  const source = request.headers.get("cf-connecting-ip") ?? "unknown";
  const id = env.RATE_LIMITER.idFromName(source);
  const stub = env.RATE_LIMITER.get(id);
  const response = await stub.fetch("https://rate.internal/release", {
    method: "POST",
    body: JSON.stringify({ kind, releaseId }),
  });
  return response.json<RateDecision>();
}

async function reportRequest(request: Request, env: Env, releaseId: bigint, locale: SupportedLocale): Promise<Response> {
  if (request.method === "GET" || request.method === "HEAD") {
    return htmlResponse(request.method === "HEAD" ? "" : renderReportPage(releaseId, "form", locale), 200, { "Cache-Control": "no-store" }, locale);
  }
  if (request.method !== "POST") return methodNotAllowed("GET, HEAD, POST");
  if (!sameOrigin(request)) return problemResponse(403, "invalid_origin", undefined, undefined, locale);
  if (!env.REPORT_ORIGIN_TOKEN || !env.REPORT_SOURCE_SALT) return problemResponse(503, "reporting_disabled", undefined, 300, locale);

  const rate = await checkRate(request, env, "report");
  if (!rate.allowed) return problemResponse(429, "rate_limited", undefined, rate.retry_after, locale);

  const form = await request.formData();
  const category = textField(form, "category", 40);
  const explanation = textField(form, "explanation", 1000);
  const contactEmail = textField(form, "contact_email", 254);
  const permission = form.get("permission_to_follow_up") === "true";
  if (!REPORT_CATEGORIES.has(category) || explanation.length < 10 || (contactEmail && !validEmail(contactEmail)) || (permission && !contactEmail)) {
    return htmlResponse(renderReportPage(releaseId, "invalid", locale), 400, { "Cache-Control": "no-store" }, locale);
  }

  const sourceHash = await hashSource(request.headers.get("cf-connecting-ip") ?? "unknown", env.REPORT_SOURCE_SALT);
  const response = await fetch(`${env.BACKEND_ORIGIN}/v1/public/releases/${releaseId}/reports`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.REPORT_ORIGIN_TOKEN}`,
      "Content-Type": "application/json",
      "X-Public-Release-Source-Hash": sourceHash,
      ...backendOriginHeaders(env),
    },
    body: JSON.stringify({
      category,
      explanation,
      ...(contactEmail ? { contact_email: contactEmail } : {}),
      permission_to_follow_up: permission,
    }),
  });
  if (response.status !== 202) {
    return problemResponse(normalizeStatus(response.status), "report_submission_failed", undefined, retryAfter(response), locale);
  }
  return htmlResponse(renderReportPage(releaseId, "accepted", locale), 202, { "Cache-Control": "no-store" }, locale);
}

async function purgeRequest(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed("POST");
  if (!env.PURGE_TOKEN || request.headers.get("authorization") !== `Bearer ${env.PURGE_TOKEN}`) {
    return problemResponse(403, "forbidden");
  }
  let releaseId: bigint;
  try {
    const input = await request.json<{ discogs_release_id: string | number }>();
    releaseId = BigInt(input.discogs_release_id);
    if (releaseId < 1n || releaseId > 9_223_372_036_854_775_807n) throw new Error("invalid id");
  } catch {
    return problemResponse(400, "invalid_purge_request");
  }
  await Promise.all(
    SUPPORTED_LOCALES.map((locale) => caches.default.delete(releaseCacheKey(`/release/${releaseId}`, locale, env.RENDERER_VERSION))),
  );
  return new Response(null, { status: 204, headers: securityHeaders({ "Cache-Control": "no-store" }) });
}

const REPORT_CATEGORIES = new Set(["privacy_publicity", "copyright_trademark", "impersonation", "malicious_link", "inaccurate_rights", "other"]);

function textField(form: FormData, key: string, maximum: number): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, maximum + 1) : "";
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

async function hashSource(source: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(source));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function methodNotAllowed(allow: string): Response {
  return new Response(null, { status: 405, headers: securityHeaders({ Allow: allow, "Cache-Control": "no-store" }) });
}

export function conditionalResponse(request: Request, response: Response): Response {
  const candidate = request.headers.get("if-none-match");
  const etag = response.headers.get("etag");
  if (!candidate || !etag) return response;
  const matches = candidate === "*" || candidate.split(",").some((value) => value.trim() === etag);
  return matches ? new Response(null, { status: 304, headers: response.headers }) : response;
}

export function cachedBrowserResponse(request: Request, cached: Response): Response {
  const response = new Response(cached.body, cached);
  response.headers.set("Cache-Control", "private, max-age=60, must-revalidate");
  return conditionalResponse(request, response);
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    return await response.json<ProblemDetails>();
  } catch {
    return { type: "about:blank", title: "Temporary failure", status: response.status };
  }
}

function normalizeStatus(status: number): number {
  return [403, 404, 410, 429, 503].includes(status) ? status : 503;
}

function retryAfter(response: Response): number | undefined {
  const value = Number(response.headers.get("retry-after"));
  return Number.isFinite(value) && value > 0 ? Math.ceil(value) : undefined;
}

function problemResponse(
  status: number,
  reason: string,
  canonicalURL?: string,
  retry?: number,
  locale: SupportedLocale = "en",
): Response {
  const problem: ProblemDetails = {
    type: `https://myvinyls.app/problems/${reason}`,
    title: status === 404 ? "Release not found" : "Release unavailable",
    status,
    reason_code: reason,
  };
  const headers: Record<string, string> = { "Cache-Control": status === 404 ? "public, max-age=60" : "no-store" };
  if (retry) headers["Retry-After"] = String(retry);
  return htmlResponse(
    renderProblemPage(problem, status === 503 || status === 429 ? canonicalURL : undefined, locale),
    status,
    headers,
    locale,
  );
}

function htmlResponse(body: string, status: number, headers: Record<string, string>, locale: SupportedLocale): Response {
  return new Response(body, {
    status,
    headers: securityHeaders({
      "Content-Language": locale,
      "Content-Type": "text/html; charset=utf-8",
      Vary: "Accept-Language",
      ...headers,
    }),
  });
}

export function releaseCacheKey(canonicalPath: string, locale: SupportedLocale, rendererVersion: string): Request {
  const parameters = new URLSearchParams({ locale, renderer: rendererVersion });
  return new Request(`https://release-cache.invalid${canonicalPath}?${parameters}`);
}

function localizedETag(etag: string | null, rendererVersion: string, releaseId: bigint, locale: SupportedLocale): string {
  const source = etag ?? `${rendererVersion}-${releaseId}`;
  const safeSource = source.replace(/[^!#-~]/g, "").replaceAll('"', "");
  return `"${safeSource}:renderer=${rendererVersion}:locale=${locale}"`;
}

function securityHeaders(extra: Record<string, string>): Headers {
  return new Headers({
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Robots-Tag": "noindex, follow, noarchive, nosnippet",
    ...extra,
  });
}

function isVerifiedCrawler(request: Request): boolean {
  const verified = (request.cf as unknown as { botManagement?: { verifiedBot?: boolean } } | undefined)?.botManagement?.verifiedBot;
  if (verified) return true;
  return /(googlebot|bingbot|yandexbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot)/i.test(request.headers.get("user-agent") ?? "");
}
