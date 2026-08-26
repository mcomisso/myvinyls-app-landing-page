# Public Release Worker operations

Public Release routes stay behind two independent controls:

- `PUBLIC_RELEASES_ENABLED` controls all public Release, alias, and report routes.
- `PUBLIC_RELEASE_CANARY_IDS` is a comma-separated list of positive signed-int64 Release IDs. Missing or empty configuration publishes none. The exact value `*` admits every valid Release only after the allowlisted canary passes.

Production sets `PUBLIC_RELEASES_ENABLED=false`, an empty canary list, and `DISABLED_PASSTHROUGH=true`. A bound production Worker therefore passes public routes to the existing origin without canonical redirects or report forms. Authenticated cache purge remains available for rollback.

Staging points to the separate staging backend and enables all fixture IDs with `PUBLIC_RELEASE_CANARY_IDS=*`. Configure `BACKEND_ORIGIN_TOKEN`, `DISCOGS_NON_AFFILIATION_NOTICE`, `PURGE_TOKEN`, `REPORT_ORIGIN_TOKEN`, and `REPORT_SOURCE_SALT` as Worker secrets. `BACKEND_ORIGIN_TOKEN` is sent to the backend as `X-Public-Release-Origin-Token` when configured.

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
