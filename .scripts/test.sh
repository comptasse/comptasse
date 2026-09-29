#!/usr/bin/env bash
# ==============================================================================
# Comptasse - full test pipeline
# ==============================================================================
# Suites:
#   1. unit tests (API)
#   2. API endpoint coverage (every route in @comptasse/application-metadata/routes)
#   3. CLI commands
#   4. dashboard frontend
#   5. Playwright E2E (opt-in)
#
# By default it starts a fresh dev environment (build + up + reset/seed), runs
# the suites against it and tears it back down. This is what `build-ci.sh` runs
# after the build.
#
# The suites run on the HOST (they need `curl` for the CLI tests, which the dev
# API container does not ship), pointed at the dev API/dashboard ports.
#
# Environment:
#   START_ENV=1          start + reset/seed the dev env, tear it down afterwards (default 1)
#   KEEP_ENV=1           do not tear the environment down (default 0)
#   RUN_E2E=1            also run the Playwright E2E suite (default 0)
#   RUN_INTEGRATION=1    also run the full legacy API integration suite (default 0,
#                        it currently contains pre-existing failures in billing /
#                        magic-link / scenarios areas)
#   SKIP_UNIT / SKIP_ENDPOINTS / SKIP_CLI / SKIP_DASHBOARD =1 to skip a suite
#
# Exit code is non-zero if any suite fails.
# ==============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DC=(docker compose --project-directory=.workflows/dev --file=.workflows/dev/compose.yml --project-name=application)
PORTS_FILE=".workflows/dev/.ports"

START_ENV="${START_ENV:-1}"
KEEP_ENV="${KEEP_ENV:-0}"
RUN_E2E="${RUN_E2E:-0}"
RUN_INTEGRATION="${RUN_INTEGRATION:-0}"

FAILED=0
declare -a RESULTS=()

step() {
    local name="$1"
    shift
    echo ""
    echo "──────────────────────────────────────────────"
    echo "  $name"
    echo "──────────────────────────────────────────────"
    if "$@"; then
        RESULTS+=("PASS  $name")
    else
        RESULTS+=("FAIL  $name")
        FAILED=1
    fi
}

echo "=============================================="
echo "  Comptasse Test Pipeline"
echo "=============================================="

if [ "$START_ENV" = "1" ]; then
    step "start environment (build + up + reset/seed)" bash -c '
        set -e
        bash .workflows/dev/up.sh
        '"${DC[*]}"' exec -T api sh -c "cd /workspace/packages/tools && pnpm run reset"
    '
fi

if [ -f "$PORTS_FILE" ]; then
    # shellcheck disable=SC1090
    . "$PORTS_FILE"
fi
export API_BASE_URL="http://localhost:${API_HOST_PORT:-3000}"
export DASHBOARD_BASE_URL="http://localhost:${DASHBOARD_HOST_PORT:-5174}"

echo "API_BASE_URL=$API_BASE_URL"
echo "DASHBOARD_BASE_URL=$DASHBOARD_BASE_URL"

if [ "${SKIP_UNIT:-0}" != "1" ]; then
    echo "Note: website unit tests are stale (they import modules that moved to the"
    echo "      dashboard/ui packages) and are excluded from this pipeline."
    step "unit tests (api)" pnpm --filter @comptasse/application-api run test:unit
fi

if [ "${SKIP_ENDPOINTS:-0}" != "1" ]; then
    step "api endpoint coverage" pnpm --filter @comptasse/application-api exec vitest run ../../tests/api/integration/allEndpoints.test.ts
fi

if [ "$RUN_INTEGRATION" = "1" ]; then
    step "api integration (full)" pnpm --filter @comptasse/application-api run test:integration
fi

if [ "${SKIP_CLI:-0}" != "1" ]; then
    step "cli tests" pnpm --filter @comptasse/application-api run test:cli
fi

if [ "${SKIP_DASHBOARD:-0}" != "1" ]; then
    step "dashboard frontend tests" pnpm --filter @comptasse/dashboard test
fi

if [ "$RUN_E2E" = "1" ]; then
    step "e2e tests" pnpm run test:e2e
fi

if [ "$START_ENV" = "1" ] && [ "$KEEP_ENV" != "1" ]; then
    echo ""
    echo "Stopping environment..."
    "${DC[@]}" down --remove-orphans >/dev/null 2>&1 || true
fi

echo ""
echo "=============================================="
echo "  Test summary"
echo "=============================================="
for result in "${RESULTS[@]}"; do
    echo "  $result"
done
echo ""
if [ "$FAILED" = "0" ]; then
    echo "All suites passed."
    exit 0
fi
echo "One or more suites failed."
exit 1
