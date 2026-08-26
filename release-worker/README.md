# Public Release Worker operations

Public Release routes stay behind two independent controls:

- `PUBLIC_RELEASES_ENABLED` controls all public Release, alias, and report routes.
- `PUBLIC_RELEASE_CANARY_IDS` is a comma-separated list of positive signed-int64 Release IDs. Missing or empty configuration publishes none. The exact value `*` admits every valid Release only after the allowlisted canary passes.

Production sets `PUBLIC_RELEASES_ENABLED=false`, an empty canary list, and `DISABLED_NOT_FOUND=true`. A bound production Worker therefore returns a generic, uncached 404 without making a same-zone subrequest, canonical redirect, or report form. Authenticated cache purge remains available for rollback.

Staging points to the separate staging backend and enables all fixture IDs with `PUBLIC_RELEASE_CANARY_IDS=*`. Configure `BACKEND_ORIGIN_TOKEN`, `DISCOGS_NON_AFFILIATION_NOTICE`, `PURGE_TOKEN`, `RATE_LIMIT_SOURCE_SALT`, `REPORT_ORIGIN_TOKEN`, and `REPORT_SOURCE_SALT` as Worker secrets. `BACKEND_ORIGIN_TOKEN` is sent to the backend as `X-Public-Release-Origin-Token` when configured.

Use independent random values for `RATE_LIMIT_SOURCE_SALT` and `REPORT_SOURCE_SALT`. Set them through `wrangler secret put`, never in `wrangler.toml`. The Worker refuses rate-limited routes when `RATE_LIMIT_SOURCE_SALT` is absent. Rotating it starts new anonymous rate partitions.

## Privacy boundary

The Worker derives each rate-limit partition by applying HMAC-SHA-256 to `CF-Connecting-IP` with `RATE_LIMIT_SOURCE_SALT`. It never uses the address itself as a Durable Object name. Each request moves that partition's deletion alarm to one hour after the request. The alarm deletes all counters and the short-lived set used to detect Release enumeration.

Production disables Workers observability, invocation logs, persisted logs, traces, and Workers Logpush in `wrangler.toml`. The Worker does not call `console` logging APIs. Backend requests are newly constructed and do not forward the browser query, referrer, cookies, authorization headers, account data, Cloudflare Ray ID, or other request metadata. The backend's privacy-safe aggregate counters are the retained telemetry source.

## Safe production preparation

Compile the production version without uploading it:

```sh
npm run dry-run:production
```

Read deployed versions and their bindings without changing Cloudflare:

```sh
npm run readback:staging
npm run readback:production
```

Cloudflare's gradual version deployment supports percentage traffic splits. After legal clearance and an allowlisted Release canary, prepare the exact split as a dry run:

```sh
./scripts/plan-production-canary.sh <current-version-id> <candidate-version-id> 5
```

The script always passes `--dry-run`. It never uploads a version, binds a production route, or changes traffic. A human must compare the readback with the approved version IDs and execute the real gradual deployment separately after gate authorization.
