#!/usr/bin/env bash
# Runs ON the EC2 host (as root, via SSM). Replaces /srv/asiapharm/<app> with
# the release archive uploaded to S3 by deploy/run-remote.sh, rebuilds the
# image with docker compose and restarts the container. The host's .env is
# kept; the previous source tree is left in <app>.prev for a manual rollback.
#
#   bash server-deploy.sh backend|frontend
set -euo pipefail

APP="${1:?usage: server-deploy.sh backend|frontend}"
case "$APP" in
  backend)  KEY=be ;;
  frontend) KEY=fe ;;
  *) echo "unknown app: $APP"; exit 1 ;;
esac

export AWS_DEFAULT_REGION=ap-southeast-1
BUCKET=asiapharmsg-db-backups
ROOT=/srv/asiapharm
DIR="$ROOT/$APP"
LOCK=/var/lock/asiapharm-deploy.lock

# Only one deploy at a time; the frontend build alone needs most of the box.
exec 9>"$LOCK"
flock -w 1800 9 || { echo "another deploy is still running after 30 min, giving up"; exit 1; }

mkdir -p "$ROOT"
NEW=$(mktemp -d -p "$ROOT" ".${APP}.new.XXXX")
trap 'rm -rf "$NEW"' EXIT

# .env lives on the host only (secrets); fall back to the S3 copy on a fresh box.
if [ -f "$DIR/.env" ]; then
  cp "$DIR/.env" "$NEW/.env"
else
  aws s3 cp "s3://$BUCKET/config/$KEY.env" "$NEW/.env" --only-show-errors
fi
chmod 600 "$NEW/.env"

aws s3 cp "s3://$BUCKET/config/$KEY.tar.gz" "$NEW/src.tar.gz" --only-show-errors
tar -xzf "$NEW/src.tar.gz" -C "$NEW"
rm -f "$NEW/src.tar.gz"

rm -rf "$DIR.prev"
if [ -d "$DIR" ]; then mv "$DIR" "$DIR.prev"; fi
mv "$NEW" "$DIR"
trap - EXIT
echo "== $APP source updated ($(ls "$DIR" | wc -l) entries)"

cd "$DIR"
echo "== building $APP image"
if ! docker compose --progress plain build > "/tmp/build-$KEY.log" 2>&1; then
  tail -40 "/tmp/build-$KEY.log"
  echo "== build failed; restoring previous source (running container untouched)"
  rm -rf "$DIR"
  [ -d "$DIR.prev" ] && mv "$DIR.prev" "$DIR"
  exit 1
fi
echo "== starting $APP"
docker compose up -d
docker image prune -f > /dev/null 2>&1 || true

CONTAINER=$(docker compose ps -q | head -1)
STATUS=none
for _ in $(seq 1 40); do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo none)
  [ "$STATUS" = "healthy" ] && break
  sleep 3
done
echo "== containers"
docker ps --format '{{.Names}}\t{{.Status}}'
if [ "$STATUS" != "healthy" ]; then
  echo "== $APP container did not become healthy"
  docker logs --tail 30 "$CONTAINER" 2>&1 || true
  exit 1
fi

echo "== public checks"
echo "api:  $(curl -s -m 10 https://api.asiapharmsg.com/)"
echo "site: HTTP $(curl -s -m 30 -o /dev/null -w '%{http_code}' https://asiapharmsg.com/)"
