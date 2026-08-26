export const MAX_RELEASE_ID = 9_223_372_036_854_775_807n;

export interface PublicReleaseSnapshot {
  schema_version: number;
  discogs_release_id: string;
  discogs_web_url: string;
  provider_fetched_at: string;
  display_expires_at: string;
  title: string;
  artists: string[];
  year: number | null;
  country: string | null;
  formats: Array<{
    quantity: number;
    name: string;
    descriptions: string[];
  }>;
  labels: Array<{
    name: string;
    catalog_number: string | null;
  }>;
  tracklist: Array<{
    position: string;
    title: string;
    duration: string | null;
  }>;
  identifiers: Array<{
    type: string;
    value: string;
  }>;
  genres: string[];
  styles: string[];
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  reason_code?: string;
}

export type ParsedReleasePath =
  | { kind: "release"; id: bigint; canonicalPath: string; needsRedirect: boolean }
  | { kind: "not-found" };

export type ParsedReportPath =
  | { kind: "report"; id: bigint; canonicalPath: string }
  | { kind: "not-found" };

export function parseReleasePath(url: URL): ParsedReleasePath {
  const match = url.pathname.match(/^\/(release|record)\/([^/]+)\/?$/);
  if (!match) return { kind: "not-found" };

  const rawId = match[2];
  if (!/^[0-9]+$/.test(rawId)) return { kind: "not-found" };

  const id = BigInt(rawId);
  if (id < 1n || id > MAX_RELEASE_ID) return { kind: "not-found" };

  const canonicalPath = `/release/${id.toString()}`;
  const needsRedirect =
    url.protocol !== "https:" ||
    url.hostname !== "myvinyls.app" ||
    url.pathname !== canonicalPath ||
    url.search.length > 0;

  return { kind: "release", id, canonicalPath, needsRedirect };
}

export function parseReportPath(url: URL): ParsedReportPath {
  const match = url.pathname.match(/^\/release\/([^/]+)\/report\/?$/);
  if (!match || !/^[0-9]+$/.test(match[1])) return { kind: "not-found" };

  const id = BigInt(match[1]);
  if (id < 1n || id > MAX_RELEASE_ID) return { kind: "not-found" };
  return { kind: "report", id, canonicalPath: `/release/${id}/report` };
}

export function isValidDiscogsWebURL(value: string, releaseId: bigint): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "www.discogs.com") return false;
    if (url.username || url.password || url.port || url.search || url.hash) return false;

    const match = url.pathname.match(/^\/release\/([0-9]+)(?:-[^/]*)?\/?$/);
    return match !== null && BigInt(match[1]) === releaseId;
  } catch {
    return false;
  }
}

export function isPublicReleaseSnapshot(value: unknown, releaseId: bigint): value is PublicReleaseSnapshot {
  if (!isObject(value) || value.schema_version !== 1) return false;
  if (typeof value.discogs_release_id !== "string" || !/^[1-9][0-9]*$/.test(value.discogs_release_id)) return false;
  try {
    if (BigInt(value.discogs_release_id) !== releaseId) return false;
  } catch {
    return false;
  }
  if (!isString(value.title) || !isString(value.provider_fetched_at) || !isString(value.display_expires_at)) return false;
  if (!isString(value.discogs_web_url) || !isValidDiscogsWebURL(value.discogs_web_url, releaseId)) return false;
  if (!isStringArray(value.artists) || !nullableInteger(value.year) || !nullableString(value.country)) return false;
  if (!isStringArray(value.genres) || !isStringArray(value.styles)) return false;
  if (!Array.isArray(value.formats) || !value.formats.every((item) =>
    isObject(item) && Number.isInteger(item.quantity) && Number(item.quantity) > 0 && isString(item.name) && isStringArray(item.descriptions))) return false;
  if (!Array.isArray(value.labels) || !value.labels.every((item) =>
    isObject(item) && isString(item.name) && nullableString(item.catalog_number))) return false;
  if (!Array.isArray(value.tracklist) || !value.tracklist.every((item) =>
    isObject(item) && isString(item.position) && isString(item.title) && nullableString(item.duration))) return false;
  return Array.isArray(value.identifiers) && value.identifiers.every((item) =>
    isObject(item) && isString(item.type) && isString(item.value));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function nullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function nullableInteger(value: unknown): value is number | null {
  return value === null || Number.isInteger(value);
}
