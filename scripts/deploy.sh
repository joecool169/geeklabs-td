#!/usr/bin/env bash
set -euo pipefail

npm run build
rsync -av --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
