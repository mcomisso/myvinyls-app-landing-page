import { describe, expect, it } from "vitest";
import worker from "../src/index";

const STAGING_HOST = "myvinyl-public-release-staging.teomatteo89.workers.dev";
const RATE_LIMITER = {
  idFromName: () => ({}) as DurableObjectId,
  get: () => ({
    fetch: async () => Response.json({ allowed: true, retry_after: 0 }),
  }),
};
const ENVIRONMENT = {
  PUBLIC_RELEASES_ENABLED: "true",
  PUBLIC_RELEASE_CANARY_IDS: "*",
  DISABLED_NOT_FOUND: "false",
  DISCOGS_NON_AFFILIATION_NOTICE: "Test notice",
  STAGING_PREVIEW_HOST: STAGING_HOST,
  RATE_LIMIT_SOURCE_SALT: "rate-limit-source-salt",
  RATE_LIMITER,
} as never;

describe("enabled staging routes", () => {
  it("keeps an allowed alias on the staging origin", async () => {
    const response = await worker.fetch(
      new Request(`https://${STAGING_HOST}/record/0042?campaign=test`, { redirect: "manual" }),
      ENVIRONMENT,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(`https://${STAGING_HOST}/release/42`);
  });

  it("keeps the report form available for an allowed staging Release", async () => {
    const response = await worker.fetch(
      new Request(`https://${STAGING_HOST}/release/42/report`),
      ENVIRONMENT,
      {} as ExecutionContext,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
