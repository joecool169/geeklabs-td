#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"
npm run build
rsync -av --delete "$ROOT_DIR/dist/" joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
