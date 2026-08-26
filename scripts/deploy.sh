#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_HOST="${DEPLOY_HOST:-geeklabs-td}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
SOURCE_REMOTE="${SOURCE_REMOTE:-forgejo}"
REMOTE_REPO="${REMOTE_REPO:-/home/joe/projects/geeklabs-td}"
REMOTE_STACK="${REMOTE_STACK:-/opt/docker/stacks/geeklabs-web}"

cd "$ROOT_DIR"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]]; then
  echo "Refusing to deploy branch '$CURRENT_BRANCH'; expected '$DEPLOY_BRANCH'." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to deploy: working tree is not clean." >&2
  exit 1
fi

DEPLOY_COMMIT="$(git rev-parse HEAD)"
DEPLOY_LABEL="$(git rev-parse --short HEAD)"
echo "Validating committed revision $DEPLOY_LABEL"
npm test
npm run build

echo "Publishing $DEPLOY_LABEL to $SOURCE_REMOTE/$DEPLOY_BRANCH"
git push "$SOURCE_REMOTE" "HEAD:refs/heads/$DEPLOY_BRANCH"

echo "Deploying $DEPLOY_LABEL on $DEPLOY_HOST"
ssh "$DEPLOY_HOST" bash -s -- \
  "$DEPLOY_COMMIT" \
  "$DEPLOY_BRANCH" \
  "$REMOTE_REPO" \
  "$REMOTE_STACK" <<'REMOTE'
set -euo pipefail

deploy_commit="$1"
deploy_branch="$2"
remote_repo="$3"
remote_stack="$4"

wait_for_healthy() {
  local container="$1"
  local health

  for ((attempt = 1; attempt <= 30; attempt++)); do
    health="$(sudo docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container")"
    if [[ "$health" == "healthy" ]]; then
      return 0
    fi
    if [[ "$health" == "unhealthy" || "$health" == "exited" || "$health" == "dead" ]]; then
      echo "Container $container entered state: $health" >&2
      sudo docker logs --tail=100 "$container" >&2
      return 1
    fi
    sleep 2
  done

  echo "Timed out waiting for $container to become healthy." >&2
  sudo docker logs --tail=100 "$container" >&2
  return 1
}

cd "$remote_repo"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to deploy: VM working tree is not clean." >&2
  exit 1
fi

git fetch origin "$deploy_branch"
git checkout "$deploy_branch"
git merge --ff-only "origin/$deploy_branch"

remote_commit="$(git rev-parse HEAD)"
if [[ "$remote_commit" != "$deploy_commit" ]]; then
  echo "VM revision $remote_commit does not match requested revision $deploy_commit." >&2
  exit 1
fi

cd "$remote_stack"
sudo docker compose config --quiet
sudo docker compose build --pull game
sudo docker compose up -d --no-deps game
wait_for_healthy defense-protocol

# Nginx resolves Compose service addresses when it starts, so refresh it after
# the game container is recreated.
sudo docker compose restart gateway
wait_for_healthy geeklabs-gateway

sudo docker exec geeklabs-gateway \
  wget -q --spider --header='Host: play.geeklabs.io' http://127.0.0.1/
REMOTE

curl --fail --silent --show-error --max-time 20 \
  https://play.geeklabs.io/ >/dev/null
curl --fail --silent --show-error --max-time 20 \
  'https://play.geeklabs.io/api/leaderboard?difficulty=medium&limit=1' >/dev/null

echo "Defense Protocol $DEPLOY_LABEL is live at https://play.geeklabs.io"
