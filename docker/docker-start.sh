#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
docker compose -f docker-compose.dev.yml up -d
echo "Chat Simulator running at http://localhost:4090"
