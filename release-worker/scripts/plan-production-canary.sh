#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <current-version-id> <candidate-version-id> <candidate-percent>" >&2
  exit 64
fi

current_version=$1
candidate_version=$2
candidate_percent=$3

if [[ ! $candidate_percent =~ ^[0-9]+$ ]] || (( candidate_percent < 1 || candidate_percent > 99 )); then
  echo "candidate-percent must be an integer between 1 and 99" >&2
  exit 64
fi

current_percent=$((100 - candidate_percent))

echo "Dry run only. No production deployment will be created."
npm exec wrangler -- versions deploy \
  "${current_version}@${current_percent}" \
  "${candidate_version}@${candidate_percent}" \
  --env production \
  --dry-run
