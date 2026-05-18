#!/usr/bin/env bash
# Sync server/.env to Vercel Production. Requires: vercel login && vercel link
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/server/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing server/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export FRONTEND_URL="${FRONTEND_URL:-https://robochamps-lms.vercel.app}"
export NODE_ENV="${NODE_ENV:-production}"
[[ "$NODE_ENV" == "development" ]] && export NODE_ENV=production

cd "$ROOT"
vercel link

for name in MONGO_URI JWT_SECRET CLOUDINARY_CLOUD_NAME CLOUDINARY_API_KEY CLOUDINARY_API_SECRET NODE_ENV FRONTEND_URL; do
  val="${!name:-}"
  if [[ -z "$val" ]]; then
    echo "Skipping $name (empty)"
    continue
  fi
  echo "Setting $name..."
  printf '%s' "$val" | vercel env add "$name" production --force
done

echo "Redeploy: vercel --prod"
echo "Check: https://robochamps-lms.vercel.app/api/health"
