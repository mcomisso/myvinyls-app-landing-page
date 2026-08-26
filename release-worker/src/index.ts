import { isPublicReleaseSnapshot, parseReleasePath, parseReportPath, type ProblemDetails } from "./contracts";
import { ReleaseRateLimiter } from "./rate-limiter";
import { renderProblemPage, renderReleasePage, renderReportPage } from "./render";

export { ReleaseRateLimiter };

interface Env {
  BACKEND_ORIGIN: string;
  PUBLIC_RELEASES_ENABLED: string;
  RENDERER_VERSION: string;
  DISCOGS_NON_AFFILIATION_NOTICE?: string;
  PURGE_TOKEN?: string;
  REPORT_ORIGIN_TOKEN?: string;
  REPORT_SOURCE_SALT?: string;
  RATE_LIMITER: DurableObjectNamespace;
}

interface RateDecision {
  allowed: boolean;
  retry_after: number;
}

const SUPPORTED_LOCALES = ["en"];

export default {
  async fetch(request: Request, env: Env, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/__internal/cache/purge") return purgeRequest(request, env);

    const report = parseReportPath(url);
    if (report.kind === "report") return reportRequest(request, env, report.id);

    const parsed = parseReleasePath(url);

    const rate = await checkRate(request, env, "release", parsed.kind === "release" ? parsed.id.toString() : undefined);
    if (!rate.allowed) return problemResponse(429, "rate_limited", undefined, rate.retry_after);
    if (parsed.kind === "not-found") return problemResponse(404, "not_found");

    const canonicalURL = `https://myvinyls.app${parsed.canonicalPath}`;
    if (parsed.needsRedirect) {
      return new Response(null, {
        status: 308,
        headers: securityHeaders({ Location: canonicalURL, "Cache-Control": "public, max-age=31536000, immutable" }),
      });
    }

    if (isVerifiedCrawler(request)) return problemResponse(403, "crawler_denied");
    if (env.PUBLIC_RELEASES_ENABLED !== "true" || !env.DISCOGS_NON_AFFILIATION_NOTICE) {
      return problemResponse(503, "release_pages_disabled", canonicalURL, 300);
    }

    const cacheKey = new Request(`https://release-cache.invalid${parsed.canonicalPath}?locale=en&renderer=${encodeURIComponent(env.RENDERER_VERSION)}`);
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;

    const traceId = request.headers.get("cf-ray") ?? crypto.randomUUID();
    const backendResponse = await fetch(`${env.BACKEND_ORIGIN}/v1/public/releases/${parsed.id}`, {
      headers: { Accept: "application/json", "X-Request-ID": traceId },
    });

    if (backendResponse.status !== 200) {
      const problem = await readProblem(backendResponse);
      return problemResponse(
        normalizeStatus(backendResponse.status),
        problem.reason_code ?? "temporary_failure",
        canonicalURL,
        retryAfter(backendResponse),
      );
    }

    const snapshot: unknown = await backendResponse.json();
    if (!isPublicReleaseSnapshot(snapshot, parsed.id)) return problemResponse(503, "invalid_snapshot", canonicalURL, 60);

    const expiry = Date.parse(snapshot.display_expires_at);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      return problemResponse(503, "snapshot_expired", canonicalURL, 60);
    }

    const ttl = Math.max(1, Math.min(300, Math.floor((expiry - Date.now()) / 1000)));
    const response = htmlResponse(renderReleasePage(snapshot, canonicalURL, env.DISCOGS_NON_AFFILIATION_NOTICE), 200, {
      "Cache-Control": `private, max-age=60, must-revalidate`,
      "CDN-Cache-Control": `public, max-age=${ttl}`,
      ETag: backendResponse.headers.get("etag") ?? `"${env.RENDERER_VERSION}-${parsed.id}"`,
    });

    const edgeResponse = new Response(response.body, response);
    edgeResponse.headers.set("Cache-Control", `public, max-age=${ttl}`);
    context.waitUntil(caches.default.put(cacheKey, edgeResponse));
    return response;
  },
} satisfies ExportedHandler<Env>;

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

async function reportRequest(request: Request, env: Env, releaseId: bigint): Promise<Response> {
  if (request.method === "GET" || request.method === "HEAD") {
    return htmlResponse(request.method === "HEAD" ? "" : renderReportPage(releaseId), 200, { "Cache-Control": "no-store" });
  }
  if (request.method !== "POST") return methodNotAllowed("GET, HEAD, POST");
  if (!sameOrigin(request)) return problemResponse(403, "invalid_origin");
  if (!env.REPORT_ORIGIN_TOKEN || !env.REPORT_SOURCE_SALT) return problemResponse(503, "reporting_disabled", undefined, 300);

  const rate = await checkRate(request, env, "report");
  if (!rate.allowed) return problemResponse(429, "rate_limited", undefined, rate.retry_after);

  const form = await request.formData();
  const category = textField(form, "category", 40);
  const explanation = textField(form, "explanation", 1000);
  const contactEmail = textField(form, "contact_email", 254);
  const permission = form.get("permission_to_follow_up") === "true";
  if (!REPORT_CATEGORIES.has(category) || explanation.length < 10 || (contactEmail && !validEmail(contactEmail)) || (permission && !contactEmail)) {
    return htmlResponse(renderReportPage(releaseId, "invalid"), 400, { "Cache-Control": "no-store" });
  }

  const sourceHash = await hashSource(request.headers.get("cf-connecting-ip") ?? "unknown", env.REPORT_SOURCE_SALT);
  const response = await fetch(`${env.BACKEND_ORIGIN}/v1/public/releases/${releaseId}/reports`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.REPORT_ORIGIN_TOKEN}`,
      "Content-Type": "application/json",
      "X-MyVinyl-Source-Hash": sourceHash,
    },
    body: JSON.stringify({
      category,
      explanation,
      contact_email: contactEmail || null,
      permission_to_follow_up: permission,
    }),
  });
  if (response.status !== 202) {
    return problemResponse(normalizeStatus(response.status), "report_submission_failed", undefined, retryAfter(response));
  }
  return htmlResponse(renderReportPage(releaseId, "accepted"), 202, { "Cache-Control": "no-store" });
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
  const key = new Request(`https://release-cache.invalid/release/${releaseId}?locale=en&renderer=${encodeURIComponent(env.RENDERER_VERSION)}`);
  await caches.default.delete(key);
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
  const bytes = new TextEncoder().encode(`${salt}:${source}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function methodNotAllowed(allow: string): Response {
  return new Response(null, { status: 405, headers: securityHeaders({ Allow: allow, "Cache-Control": "no-store" }) });
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

function problemResponse(status: number, reason: string, canonicalURL?: string, retry?: number): Response {
  const problem: ProblemDetails = {
    type: `https://myvinyls.app/problems/${reason}`,
    title: status === 404 ? "Release not found" : "Release unavailable",
    status,
    reason_code: reason,
  };
  const headers: Record<string, string> = { "Cache-Control": status === 404 ? "public, max-age=60" : "no-store" };
  if (retry) headers["Retry-After"] = String(retry);
  return htmlResponse(renderProblemPage(problem, status === 503 || status === 429 ? canonicalURL : undefined), status, headers);
}

function htmlResponse(body: string, status: number, headers: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: securityHeaders({ "Content-Type": "text/html; charset=utf-8", ...headers }),
  });
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
