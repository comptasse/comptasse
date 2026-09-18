#!/bin/sh
#
# Comptasse self-hosted installer (API + Dashboard + CLI)
#
# Usage:
#   curl -fsSL https://comptasse.com/install.sh | sh        # production (GHCR images)
#   curl -fsSL http://localhost:5173/install.sh | sh        # local dev (built from source)
#
# Behaviour:
#   1. Verifies Docker is installed and running.
#   2. Asks whether you already have PostgreSQL + S3, or want the integrated services.
#   3. Integrated: configures PostgreSQL and RustFS automatically.
#      External:   uses the provided connection credentials.
#   4. Generates a COOKIES_KEY session-signing key if none is provided.
#   5. Creates the config directory in ~/.comptasse.
#   6. Pulls (production) or builds (local) the Comptasse API + Dashboard images
#      and starts the stack. The website is hosted by the maintainers and is not
#      part of self-hosted installs.
#   7. Installs the comptasse CLI on the host from GitHub Releases.
#
# Configuration (environment variables):
#   Image source (automatic, based on the origin the installer is served from):
#       comptasse.com  -> pull the published images from GHCR (production)
#       any other      -> build the images from a local repository checkout (local development)
#   COMPTASSE_SOURCE_ORIGIN                        default: https://comptasse.com
#       Origin the installer was fetched from; injected automatically by the
#       local dev server, and overridable for testing.
#   COMPTASSE_SERVICES=integrated|external        default: integrated
#   COMPTASSE_DATA_DIR                            default: ~/.comptasse
#   COMPTASSE_IMAGE                               base image name override (default: ghcr.io/comptasse)
#   COMPTASSE_REPO_DIR                            local development: path to the repository checkout
#                                                 (optional; otherwise auto-detected from the working directory)
#   COMPTASSE_VERSION                             image tag (default: latest for registry, dev for local build)
#   COMPTASSE_API_PORT / COMPTASSE_DASHBOARD_PORT default: 3000 / 5173
#   COMPTASSE_COOKIES_KEY                         optional; generated if absent
#   COMPTASSE_SKIP_CLI=true                       skip installing the CLI on the host
#   External services only:
#       COMPTASSE_SQL_DATABASE_URL, COMPTASSE_STORAGE_ENDPOINT,
#       COMPTASSE_STORAGE_BUCKET_NAME, COMPTASSE_STORAGE_ACCESS_KEY,
#       COMPTASSE_STORAGE_SECRET_KEY, COMPTASSE_STORAGE_REGION
#
set -eu

# ------------------------------------------------------------------------------
# Prerequisites
# ------------------------------------------------------------------------------
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required." >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Error: Docker is not running. Start Docker and retry." >&2; exit 1; }

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
DATA_DIR="${COMPTASSE_DATA_DIR:-$HOME/.comptasse}"
COMPOSE_FILE="${DATA_DIR}/compose.yml"
ENV_FILE="${DATA_DIR}/.env"
API_PORT="${COMPTASSE_API_PORT:-3000}"
DASHBOARD_PORT="${COMPTASSE_DASHBOARD_PORT:-5173}"
SERVICES="${COMPTASSE_SERVICES:-integrated}"
SOURCE_ORIGIN="${COMPTASSE_SOURCE_ORIGIN:-https://comptasse.com}"
IMAGE_BASE="${COMPTASSE_IMAGE:-ghcr.io/comptasse}"

INTERACTIVE=false
[ -t 0 ] && INTERACTIVE=true

echo "Installing Comptasse (API + Dashboard + CLI)"
echo ""

# ------------------------------------------------------------------------------
# Image source: comptasse.com -> production (GHCR); any other origin -> local build
# ------------------------------------------------------------------------------
_find_repo_root() {
    if [ -n "${COMPTASSE_REPO_DIR:-}" ]; then
        if [ -f "$COMPTASSE_REPO_DIR/.workflows/build/compose.yml" ] && [ -f "$COMPTASSE_REPO_DIR/VERSION" ]; then
            printf '%s\n' "$COMPTASSE_REPO_DIR"
            return 0
        fi
        echo "Warning: COMPTASSE_REPO_DIR is not a Comptasse checkout, ignoring it." >&2
    fi
    _dir=$PWD
    while [ "$_dir" != "/" ]; do
        if [ -f "$_dir/.workflows/build/compose.yml" ] && [ -f "$_dir/VERSION" ]; then
            printf '%s\n' "$_dir"
            return 0
        fi
        _dir=$(dirname "$_dir")
    done
    return 1
}

case "$SOURCE_ORIGIN" in
    *://comptasse.com | *://*.comptasse.com) IMAGE_SOURCE="registry" ;;
    *) IMAGE_SOURCE="local" ;;
esac

if [ "$IMAGE_SOURCE" = "local" ]; then
    echo "[1/5] Building the local Comptasse API + Dashboard images (no registry)..."
    REPO_ROOT=$(_find_repo_root) || true
    if [ -n "$REPO_ROOT" ]; then
        (
            cd "$REPO_ROOT" &&
            COMPTASSE_VERSION="${COMPTASSE_VERSION:-dev}" \
            docker compose -f .workflows/build/compose.yml build api dashboard
        )
        API_IMAGE="comptasse-api:${COMPTASSE_VERSION:-dev}"
        DASHBOARD_IMAGE="comptasse-dashboard:${COMPTASSE_VERSION:-dev}"
    elif docker image inspect "comptasse-api:${COMPTASSE_VERSION:-dev}" >/dev/null 2>&1; then
        API_IMAGE="comptasse-api:${COMPTASSE_VERSION:-dev}"
        DASHBOARD_IMAGE="comptasse-dashboard:${COMPTASSE_VERSION:-dev}"
        echo "Using the already-built local images."
    else
        echo "Error: local build requires the Comptasse repository checkout." >&2
        echo "Run the installer from the repository (or any of its subdirectories), or pass the checkout path:" >&2
        echo "  curl -fsSL $SOURCE_ORIGIN/install.sh | COMPTASSE_REPO_DIR=/path/to/comptasse sh" >&2
        exit 1
    fi
else
    echo "[1/5] Preparing to pull ${IMAGE_BASE}/{api,dashboard}..."
    API_IMAGE="${IMAGE_BASE}/api:${COMPTASSE_VERSION:-latest}"
    DASHBOARD_IMAGE="${IMAGE_BASE}/dashboard:${COMPTASSE_VERSION:-latest}"
fi

# ------------------------------------------------------------------------------
# Services choice
# ------------------------------------------------------------------------------
if [ "$INTERACTIVE" = "true" ] && [ -z "${COMPTASSE_SERVICES:-}" ]; then
    printf 'Do you already have PostgreSQL and S3 storage? [y/N] '
    read -r answer
    case "$answer" in
        y | Y | yes | oui) SERVICES="external" ;;
        *) SERVICES="integrated" ;;
    esac
fi

# ------------------------------------------------------------------------------
# COOKIES_KEY (session signing key)
# ------------------------------------------------------------------------------
COOKIES_KEY="${COMPTASSE_COOKIES_KEY:-}"
if [ -z "$COOKIES_KEY" ] && [ -f "$ENV_FILE" ]; then
    COOKIES_KEY=$(sed -n 's/^COOKIES_KEY=//p' "$ENV_FILE" | tail -n 1)
fi
if [ -z "$COOKIES_KEY" ]; then
    COOKIES_KEY=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
fi

mkdir -p "$DATA_DIR"

# ------------------------------------------------------------------------------
# Generate compose.yml + .env
# ------------------------------------------------------------------------------
if [ "$SERVICES" = "integrated" ]; then
    echo "[2/5] Configuring integrated services (PostgreSQL + RustFS)..."
    cat > "$ENV_FILE" <<EOF
API_IMAGE=$API_IMAGE
DASHBOARD_IMAGE=$DASHBOARD_IMAGE
COMPTASSE_API_PORT=$API_PORT
COMPTASSE_DASHBOARD_PORT=$DASHBOARD_PORT
CORS_ORIGIN=http://localhost:$DASHBOARD_PORT
COOKIES_KEY=$COOKIES_KEY
EOF

    cat > "$COMPOSE_FILE" <<'EOF'
services:
  api:
    image: ${API_IMAGE}
    container_name: comptasse-api
    ports:
      - "${COMPTASSE_API_PORT}:3000"
    environment:
      ENV: production
      VERBOSE: "false"
      PORT: "3000"
      CORS_ORIGIN: ${CORS_ORIGIN}
      COOKIES_DOMAIN: localhost
      COOKIES_KEY: ${COOKIES_KEY:?COOKIES_KEY is required}
      API_BASE_URL: http://localhost:${COMPTASSE_API_PORT}
      WEBSITE_BASE_URL: https://comptasse.com
      DASHBOARD_BASE_URL: http://localhost:${COMPTASSE_DASHBOARD_PORT}
      SQL_DATABASE_URL: postgres://postgres:password@postgres:5432/comptasse
      STORAGE_ENDPOINT: http://rustfs:9000
      STORAGE_BUCKET_NAME: comptasse-files
      STORAGE_ACCESS_KEY: admin
      STORAGE_SECRET_KEY: admin
      STORAGE_REGION: fr-par
    depends_on:
      postgres:
        condition: service_healthy
      rustfs:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('http').get('http://127.0.0.1:' + process.env.PORT, r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))\""]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 60s
    restart: unless-stopped

  dashboard:
    image: ${DASHBOARD_IMAGE}
    container_name: comptasse-dashboard
    environment:
      API_BASE_URL: /api
    ports:
      - "${COMPTASSE_DASHBOARD_PORT}:80"
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:18.1
    container_name: comptasse-postgres
    volumes:
      - postgres-data:/var/lib/postgresql
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: comptasse
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d comptasse"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  rustfs:
    image: rustfs/rustfs:latest
    container_name: comptasse-rustfs
    volumes:
      - rustfs-data:/data
    environment:
      RUSTFS_CONSOLE_ENABLE: "false"
      RUSTFS_ACCESS_KEY: admin
      RUSTFS_SECRET_KEY: admin
      RUSTFS_VOLUMES: /data
    restart: unless-stopped

volumes:
  postgres-data:
  rustfs-data:
EOF
else
    echo "[2/5] Configuring external services (your PostgreSQL + S3)..."

    SQL_DATABASE_URL="${COMPTASSE_SQL_DATABASE_URL:-}"
    STORAGE_ENDPOINT="${COMPTASSE_STORAGE_ENDPOINT:-}"
    STORAGE_BUCKET_NAME="${COMPTASSE_STORAGE_BUCKET_NAME:-}"
    STORAGE_ACCESS_KEY="${COMPTASSE_STORAGE_ACCESS_KEY:-}"
    STORAGE_SECRET_KEY="${COMPTASSE_STORAGE_SECRET_KEY:-}"

    prompt_or_fail() {
        _var=$1
        _label=$2
        eval "_value=\${$_var:-}"
        if [ -z "$_value" ]; then
            if [ "$INTERACTIVE" = "true" ]; then
                printf '%s: ' "$_label"
                read -r _value
                eval "$_var=\$_value"
            else
                echo "Error: $_label is required." >&2
                echo "Set the corresponding COMPTASSE_* environment variable (e.g. COMPTASSE_SQL_DATABASE_URL) or run the installer interactively." >&2
                exit 1
            fi
        fi
    }

    prompt_or_fail SQL_DATABASE_URL "PostgreSQL connection URL (postgres://user:password@host:5432/db)"
    prompt_or_fail STORAGE_ENDPOINT "S3 endpoint URL (https://...)"
    prompt_or_fail STORAGE_BUCKET_NAME "S3 bucket name"
    prompt_or_fail STORAGE_ACCESS_KEY "S3 access key"
    prompt_or_fail STORAGE_SECRET_KEY "S3 secret key"
    STORAGE_REGION="${COMPTASSE_STORAGE_REGION:-fr-par}"

    cat > "$ENV_FILE" <<EOF
API_IMAGE=$API_IMAGE
DASHBOARD_IMAGE=$DASHBOARD_IMAGE
COMPTASSE_API_PORT=$API_PORT
COMPTASSE_DASHBOARD_PORT=$DASHBOARD_PORT
CORS_ORIGIN=http://localhost:$DASHBOARD_PORT
COOKIES_KEY=$COOKIES_KEY
SQL_DATABASE_URL=$SQL_DATABASE_URL
STORAGE_ENDPOINT=$STORAGE_ENDPOINT
STORAGE_BUCKET_NAME=$STORAGE_BUCKET_NAME
STORAGE_ACCESS_KEY=$STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY=$STORAGE_SECRET_KEY
STORAGE_REGION=$STORAGE_REGION
EOF

    cat > "$COMPOSE_FILE" <<'EOF'
services:
  api:
    image: ${API_IMAGE}
    container_name: comptasse-api
    ports:
      - "${COMPTASSE_API_PORT}:3000"
    environment:
      ENV: production
      VERBOSE: "false"
      PORT: "3000"
      CORS_ORIGIN: ${CORS_ORIGIN}
      COOKIES_DOMAIN: localhost
      COOKIES_KEY: ${COOKIES_KEY:?required}
      API_BASE_URL: http://localhost:${COMPTASSE_API_PORT}
      WEBSITE_BASE_URL: https://comptasse.com
      DASHBOARD_BASE_URL: http://localhost:${COMPTASSE_DASHBOARD_PORT}
      SQL_DATABASE_URL: ${SQL_DATABASE_URL:?required}
      STORAGE_ENDPOINT: ${STORAGE_ENDPOINT:?required}
      STORAGE_BUCKET_NAME: ${STORAGE_BUCKET_NAME:?required}
      STORAGE_ACCESS_KEY: ${STORAGE_ACCESS_KEY:?required}
      STORAGE_SECRET_KEY: ${STORAGE_SECRET_KEY:?required}
      STORAGE_REGION: ${STORAGE_REGION:-fr-par}
    healthcheck:
      test: ["CMD-SHELL", "node -e \"require('http').get('http://127.0.0.1:' + process.env.PORT, r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))\""]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 60s
    restart: unless-stopped

  dashboard:
    image: ${DASHBOARD_IMAGE}
    container_name: comptasse-dashboard
    environment:
      API_BASE_URL: /api
    ports:
      - "${COMPTASSE_DASHBOARD_PORT}:80"
    depends_on:
      - api
    restart: unless-stopped
EOF
fi

# ------------------------------------------------------------------------------
# Install the CLI on the host (from GitHub Releases)
# ------------------------------------------------------------------------------
if [ "${COMPTASSE_SKIP_CLI:-false}" = "true" ]; then
    echo "[3/5] Skipping CLI installation (COMPTASSE_SKIP_CLI=true)."
else
    echo "[3/5] Installing the comptasse CLI on the host..."
    CLI_INSTALL_DIR="${COMPTASSE_INSTALL_DIR:-$HOME/.local/bin}"
    CLI_DEST="${CLI_INSTALL_DIR}/comptasse"
    mkdir -p "$CLI_INSTALL_DIR"
    curl -fsSL --progress-bar "https://github.com/comptasse/comptasse/releases/latest/download/comptasse.sh" -o "$CLI_DEST"
    chmod +x "$CLI_DEST"
    echo "Installed CLI: $CLI_DEST"
fi

# ------------------------------------------------------------------------------
# Start
# ------------------------------------------------------------------------------
echo "[4/5] Starting Comptasse (api: $API_IMAGE, dashboard: $DASHBOARD_IMAGE)..."
docker compose --project-name comptasse --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "[5/5] "
echo ""
echo "Installation complete"
echo ""
echo "  Dashboard: http://localhost:$DASHBOARD_PORT"
echo "  API:       http://localhost:$API_PORT"
if [ "${COMPTASSE_SKIP_CLI:-false}" != "true" ]; then
    echo "  CLI:       $CLI_DEST --help"
fi
echo ""
echo "  Config:    $DATA_DIR"
echo "  Services:  docker compose --project-name comptasse -f $COMPOSE_FILE ps"
echo "  Logs:      docker compose --project-name comptasse -f $COMPOSE_FILE logs -f api"
echo ""
echo "Next steps: open the Dashboard, create your account and your first organization."