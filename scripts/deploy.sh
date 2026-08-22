#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Refusing to deploy: working tree is not clean." >&2
  exit 1
fi

DEPLOY_COMMIT="$(git rev-parse --short HEAD)"
echo "Deploying committed revision $DEPLOY_COMMIT"
npm run build
rsync -av --delete "$ROOT_DIR/dist/" joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
rsync -avnc --delete "$ROOT_DIR/dist/" joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
