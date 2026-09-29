#!/usr/bin/env bash
# ==============================================================================
# dev-up helper - called by `just dev up`
# Starts all Docker Compose services with random host ports bound to 127.0.0.1.
# Ports persist across runs in .ports; conflicted ports are replaced on next run.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/compose.yml"
PORTS_FILE="$SCRIPT_DIR/.ports"

# Host path of the repository checkout, so the install.sh installer (served by
# the website dev container) can build the all-in-one image from source even
# when run via `curl ... | sh` from an unrelated directory.
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export COMPTASSE_REPO_ROOT="$REPO_ROOT"

# The website/dashboard dev servers import @comptasse/application-metadata
# through its built entry (see packages/metadata/package.json "exports").
# Dependencies are installed on the host, but a fresh checkout has no build/
# directory, so compile it before the containers start; otherwise Vite fails to
# resolve the package entry and the website service never becomes healthy.
echo "Building @comptasse/application-metadata..."
pnpm --filter @comptasse/application-metadata build

DC=(docker compose --project-directory="$SCRIPT_DIR" --file="$COMPOSE_FILE" --project-name=application)

_random_port() {
    python3 -c "import random; print(random.randint(10000, 65535))"
}

_is_port_in_use() {
    local port=$1
    ss -tln "sport = :$port" 2>/dev/null | grep -q LISTEN
}

_is_valid_five_digit_port() {
    local port=$1
    [[ "$port" =~ ^[1-9][0-9]{4}$ ]] && (( port <= 65535 ))
}

"${DC[@]}" down --remove-orphans 2>/dev/null || true

# Clean up stale dev containers that may have been created under another
# compose project name while still using the same explicit container_name.
for container_name in comptasse-postgres comptasse-rustfs comptasse-api comptasse-website comptasse-dashboard arrhes-postgres arrhes-rustfs arrhes-api arrhes-website arrhes-dashboard; do
    docker rm -f "$container_name" >/dev/null 2>&1 || true
done

# Load persisted ports if available.
declare -A saved=()
if [[ -f "$PORTS_FILE" ]]; then
    while IFS='=' read -r key val; do
        [[ -n "$key" ]] && saved["$key"]="$val"
    done < "$PORTS_FILE"
fi

declare -A used=()

_allocate_port_for_key() {
    local key=$1
    local candidate="${saved[$key]:-}"

    if [[ -n "$candidate" ]] && _is_valid_five_digit_port "$candidate" && ! _is_port_in_use "$candidate" && [[ -z "${used[$candidate]:-}" ]]; then
        used["$candidate"]=1
        echo "$candidate"
        return
    fi

    while true; do
        candidate="$(_random_port)"
        if _is_valid_five_digit_port "$candidate" && ! _is_port_in_use "$candidate" && [[ -z "${used[$candidate]:-}" ]]; then
            used["$candidate"]=1
            echo "$candidate"
            return
        fi
    done
}

website_host_port=$(_allocate_port_for_key WEBSITE_HOST_PORT)
api_host_port=$(_allocate_port_for_key API_HOST_PORT)
storage_host_port=$(_allocate_port_for_key STORAGE_HOST_PORT)
rustfs_ui_host_port=$(_allocate_port_for_key RUSTFS_UI_HOST_PORT)
postgres_host_port=$(_allocate_port_for_key POSTGRES_HOST_PORT)
dashboard_host_port=$(_allocate_port_for_key DASHBOARD_HOST_PORT)

cat > "$PORTS_FILE" <<EOF
WEBSITE_HOST_PORT=$website_host_port
API_HOST_PORT=$api_host_port
STORAGE_HOST_PORT=$storage_host_port
RUSTFS_UI_HOST_PORT=$rustfs_ui_host_port
POSTGRES_HOST_PORT=$postgres_host_port
DASHBOARD_HOST_PORT=$dashboard_host_port
EOF

if ! WEBSITE_HOST_PORT="$website_host_port" \
   API_HOST_PORT="$api_host_port" \
   STORAGE_HOST_PORT="$storage_host_port" \
   RUSTFS_UI_HOST_PORT="$rustfs_ui_host_port" \
   POSTGRES_HOST_PORT="$postgres_host_port" \
   DASHBOARD_HOST_PORT="$dashboard_host_port" \
       "${DC[@]}" up --detach --build --force-recreate --wait; then
    echo ""
    echo "=============================================="
    echo "  ERROR: one or more services failed to start"
    echo "=============================================="
    echo ""
    # Print logs for every exited container so the error is visible
    for container in $("${DC[@]}" ps --all --filter status=exited --format '{{.Name}}' 2>/dev/null); do
        echo "--- Logs for $container ---"
        docker logs "$container" 2>&1 | tail -30
        echo ""
    done
    exit 1
fi

echo ""
echo "=============================================="
echo "  Comptasse Development Environment"
echo "=============================================="
echo ""
echo "  Services:"
echo "    Dashboard:  http://localhost:$dashboard_host_port"
echo "    Website:    http://localhost:$website_host_port"
echo "    API:        http://localhost:$api_host_port"
echo ""
echo "  Infrastructure:"
echo "    PostgreSQL: postgres://postgres:admin@localhost:$postgres_host_port/default"
echo "    Storage:    http://localhost:$storage_host_port"
echo "    RustFS UI:  http://localhost:$rustfs_ui_host_port"
echo ""
echo "  Demo Credentials:"
echo "    Email:      demo@comptasse.com"
echo "    Password:   demo"
echo ""
echo "  Logs: docker compose -f $COMPOSE_FILE logs -f"
echo "=============================================="
echo ""
