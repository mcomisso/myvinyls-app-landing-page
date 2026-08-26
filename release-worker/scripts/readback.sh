#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]] || [[ $1 != "staging" && $1 != "production" ]]; then
  echo "Usage: $0 <staging|production>" >&2
  exit 64
fi

worker_environment=$1
status_file=$(mktemp)
trap 'rm -f "$status_file"' EXIT

npm exec wrangler -- deployments status --env "$worker_environment" --json > "$status_file"
jq . "$status_file"

jq -r '.. | objects | .version_id? // .versionId? // empty' "$status_file" \
  | sort -u \
  | while IFS= read -r version_id; do
      npm exec wrangler -- versions view "$version_id" --env "$worker_environment" --json
    done
