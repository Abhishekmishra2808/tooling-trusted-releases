#!/bin/sh
set -eu

cd "$(dirname "$0")"

if [ -z "${1:-}" ]
then
  echo "Usage: $0 <test-pattern>"
  echo "Example: $0 sbom"
  exit 1
fi

echo "Building and running ATR e2e test: $1"
docker compose build e2e
docker compose up atr -d --build --wait
docker compose run --rm e2e pytest "e2e/$1/" -v

docker compose down -v
