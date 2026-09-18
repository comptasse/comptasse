#!/bin/sh
set -eu

version="${1:?version argument is required}"

: "${REGISTRY:=ghcr.io}"
: "${IMAGE_PREFIX:=ghcr.io/comptasse}"

export COMPTASSE_VERSION="$version"

docker compose -f .workflows/build/compose.yml build api dashboard website

# API image
docker tag "comptasse-api:${version}" "${IMAGE_PREFIX}/api:${version}"
docker tag "${IMAGE_PREFIX}/api:${version}" "${IMAGE_PREFIX}/api:latest"
docker push "${IMAGE_PREFIX}/api:${version}"
docker push "${IMAGE_PREFIX}/api:latest"

# Dashboard image
docker tag "comptasse-dashboard:${version}" "${IMAGE_PREFIX}/dashboard:${version}"
docker tag "${IMAGE_PREFIX}/dashboard:${version}" "${IMAGE_PREFIX}/dashboard:latest"
docker push "${IMAGE_PREFIX}/dashboard:${version}"
docker push "${IMAGE_PREFIX}/dashboard:latest"

# Website image
docker tag "comptasse-website:${version}" "${IMAGE_PREFIX}/website:${version}"
docker tag "${IMAGE_PREFIX}/website:${version}" "${IMAGE_PREFIX}/website:latest"
docker push "${IMAGE_PREFIX}/website:${version}"
docker push "${IMAGE_PREFIX}/website:latest"

echo "Published ${IMAGE_PREFIX}/{api,dashboard,website}:${version} (+ latest)"