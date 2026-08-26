interface RateState {
  minuteStartedAt: number;
  minuteCount: number;
  enumerationStartedAt: number;
  releaseIds: string[];
  reportStartedAt: number;
  reportCount: number;
}

interface RateRequest {
  kind: "release" | "report";
  releaseId?: string;
  now?: number;
}

const MINUTE_MS = 60_000;
const ENUMERATION_WINDOW_MS = 10 * MINUTE_MS;
const REPORT_WINDOW_MS = 60 * MINUTE_MS;
const STATE_RETENTION_MS = REPORT_WINDOW_MS;

export class ReleaseRateLimiter implements DurableObject {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") return new Response(null, { status: 405 });

    const input = await request.json<RateRequest>();
    const now = input.now ?? Date.now();
    await this.state.storage.setAlarm(now + STATE_RETENTION_MS);
    const current = (await this.state.storage.get<RateState>("rate")) ?? {
      minuteStartedAt: now,
      minuteCount: 0,
      enumerationStartedAt: now,
      releaseIds: [],
      reportStartedAt: now,
      reportCount: 0,
    };

    if (input.kind === "report") {
      if (now - current.reportStartedAt >= REPORT_WINDOW_MS) {
        current.reportStartedAt = now;
        current.reportCount = 0;
      }
      current.reportCount += 1;
      await this.state.storage.put("rate", current);
      return result(current.reportCount <= 5, current.reportStartedAt + REPORT_WINDOW_MS - now);
    }

    if (now - current.minuteStartedAt >= MINUTE_MS) {
      current.minuteStartedAt = now;
      current.minuteCount = 0;
    }
    if (now - current.enumerationStartedAt >= ENUMERATION_WINDOW_MS) {
      current.enumerationStartedAt = now;
      current.releaseIds = [];
    }

    current.minuteCount += 1;
    if (input.releaseId && !current.releaseIds.includes(input.releaseId)) {
      current.releaseIds.push(input.releaseId);
    }

    const minuteAllowed = current.minuteCount <= 60;
    const enumerationAllowed = current.releaseIds.length <= 20;
    await this.state.storage.put("rate", current);

    const retryAfter = minuteAllowed
      ? current.enumerationStartedAt + ENUMERATION_WINDOW_MS - now
      : current.minuteStartedAt + MINUTE_MS - now;
    return result(minuteAllowed && enumerationAllowed, retryAfter);
  }

  async alarm(): Promise<void> {
    await this.state.storage.deleteAll();
  }
}

function result(allowed: boolean, retryAfterMs: number): Response {
  return Response.json({ allowed, retry_after: Math.max(1, Math.ceil(retryAfterMs / 1000)) });
}
