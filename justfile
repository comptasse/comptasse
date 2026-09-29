set shell := ["bash", "-cu"]
COMPOSE_FILE := ".workflows/dev/compose.yml"
PROJECT := "application"
DC := "docker compose --project-directory=.workflows/dev --file=" + COMPOSE_FILE + " --project-name=" + PROJECT

dev cmd:
    @just dev-{{cmd}}

dev-up:
    @bash .workflows/dev/up.sh

dev-down:
    {{DC}} down --remove-orphans

# ==============================================================================
# Database (requires dev environment running)
# ==============================================================================

db cmd:
    @just db-{{cmd}}

# Push schema to database (idempotent, no data loss)
db-push:
    @echo "Pushing schema to database..."
    {{DC}} exec api sh -c "cd /workspace/packages/tools && pnpm run push"
    @echo "Schema push complete."

# Seed database with demo data (skips if data already exists)
db-seed:
    @echo "Seeding database..."
    {{DC}} exec api sh -c "cd /workspace/packages/tools && pnpm run seed"
    @echo "Seeding complete."

# Reset database (clear all tables, push schema, seed)
db-reset:
    @echo "Resetting database (clear + push + seed)..."
    {{DC}} exec api sh -c "cd /workspace/packages/tools && pnpm run reset"
    @echo "Database reset complete."

# ==============================================================================
# Build Pipeline
# ==============================================================================
# Uses the same compose file as CI (single source of truth):
#   1. ci service: pnpm install, Biome check, unit tests, build
#   2. api/website/worker services: production Docker images
#
# Usage:
#   just build ci      - Run CI gate only (lint + typecheck + tests + build)
#   just build images  - CI gate + build api/website/worker images (same as publish GH Action)
#   just build start   - Start built images against local infra to check for startup errors

COMPOSE_BUILD := "docker compose --progress=plain -f .workflows/build/compose.yml"
COMPOSE_START := "docker compose -f .workflows/build/compose.start.yml --project-name comptasse-prod"

build cmd:
    @just build-{{cmd}}

# Stamp packages/cli/comptasse.sh and packages/cli/version from the VERSION file
build-cli:
    @VER=$(cat VERSION | tr -d 'v[:space:]') && \
    printf '%s\n' "$VER" > packages/cli/version && \
    echo "CLI version file generated from VERSION: $VER"

# Build all three production Docker images (api, dashboard, website)
build-images:
    @echo "=============================================="
    @echo "  Comptasse Image Build ($(cat VERSION))"
    @echo "=============================================="
    @echo ""
    COMPTASSE_VERSION=$(cat VERSION) {{COMPOSE_BUILD}} build --no-cache api dashboard website
    @echo ""
    @echo "=============================================="
    @echo "  Images built: comptasse-{api,dashboard,website} ($(cat VERSION))"
    @echo "=============================================="

# Run CI gate: lint + typecheck + unit tests + build
build-ci:
    @echo "=============================================="
    @echo "  Comptasse Build (lint + test + build)"
    @echo "=============================================="
    @echo ""
    COMPTASSE_VERSION=$(cat VERSION) {{COMPOSE_BUILD}} build --no-cache api dashboard website
    @echo ""
    @echo "=============================================="
    @echo "  Build succeeded"
    @echo "=============================================="

# Start production images against local infrastructure to check for startup errors
# Requires images to be built first: just build images
# Stops the dev environment first to free ports, then starts production images
build-start:
    @echo "=============================================="
    @echo "  Starting production images (version: $(cat VERSION))"
    @echo "  Press Ctrl+C to stop"
    @echo "=============================================="
    @echo ""
    -{{DC}} down --remove-orphans 2>/dev/null || true
    -COMPTASSE_VERSION=$(cat VERSION) {{COMPOSE_START}} down --remove-orphans 2>/dev/null || true
    COMPTASSE_VERSION=$(cat VERSION) {{COMPOSE_START}} up --force-recreate --remove-orphans

# ==============================================================================
# Tests (requires dev environment running)
# ==============================================================================

# Run all unit tests
test-unit:
    {{DC}} exec api sh -c "pnpm --recursive --if-present --filter='./packages/**' run test:unit"

# Run all integration tests
test-integration:
    {{DC}} exec api sh -c "pnpm --filter='@comptasse/application-api' run test:integration"

# Run all Playwright E2E tests
test-e2e:
    {{DC}} exec api sh -c "pnpm run test:e2e"

# Run all tests: unit + integration + E2E
test:
    {{DC}} exec api sh -c "pnpm --recursive --if-present --filter='./packages/**' run test && pnpm run test:e2e"

# Run the full test pipeline (unit + API + CLI + dashboard [+ e2e]).
# Starts a fresh dev environment and tears it down afterwards (see .scripts/test.sh).
test-all:
    bash .scripts/test.sh

# Build the production images, then run the full test pipeline.
build-and-test:
    @just build images
    @bash .scripts/test.sh
