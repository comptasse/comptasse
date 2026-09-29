# ==============================================================================
# Comptasse API Docker Image
# ==============================================================================
# Multi-stage build that compiles the API + workspace dependencies, generates
# the SQL migrations (full schema setup + delta from the last release snapshot),
# and packages a self-contained production runtime with production deps only.
#
# Runtime environment (required by the API, see packages/api/src/utilities/getEnv.ts):
#   ENV=production VERBOSE=false PORT=3000
#   CORS_ORIGIN COOKIES_DOMAIN COOKIES_KEY [USER_SESSION_COOKIE_MAX_AGE=31536000]
#   API_BASE_URL WEBSITE_BASE_URL DASHBOARD_BASE_URL
#   SQL_DATABASE_URL
#   STORAGE_ENDPOINT STORAGE_BUCKET_NAME STORAGE_ACCESS_KEY STORAGE_SECRET_KEY [STORAGE_REGION]
#   [OCR_API_KEY OCR_ENDPOINT OCR_MODEL]
#
# On startup the entrypoint runs build/migrate.js (creates the schema on a fresh
# database, applies incremental deltas on upgrades) then starts the server.
# ==============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build
# ---------------------------------------------------------------------------
FROM node:25.2.1-alpine AS base
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm install -g pnpm@11.28.2

FROM base AS build
WORKDIR /root
COPY . .
RUN pnpm install

# Build API and its workspace dependencies (metadata, ...)
RUN pnpm --filter @comptasse/application-api... run build

# Generate SQL migrations: 0000_setup.sql (full current schema) +
# 0001_from_last_update.sql (delta vs the committed baseline snapshot; empty
# file if the schema did not change).
RUN cd packages/tools && MIGRATIONS_OUT=/tmp/migrations pnpm exec tsx ./src/generateMigrations.ts

# Create a self-contained deploy output with production dependencies only.
# Workspace dependencies (e.g. @comptasse/application-metadata) are vendored
# inside the deploy output's node_modules/.pnpm store, so the runtime stage
# only needs this directory.
RUN pnpm --filter @comptasse/application-api deploy --legacy --prod /deploy

# ---------------------------------------------------------------------------
# Stage 2: Runtime
# ---------------------------------------------------------------------------
FROM node:25.2.1-alpine AS deploy
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /deploy .
COPY --from=build /tmp/migrations ./migrations
COPY .workflows/build/packages/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Build-time smoke tests: catch packaging issues before the image is finalized.
RUN test -f build/server.js && \
    test -f build/migrate.js && \
    node --check build/server.js && \
    node --check build/migrate.js && \
    test -f migrations/0000_setup.sql && \
    test -f migrations/0001_from_last_update.sql && \
    sh -n /entrypoint.sh && \
    echo "API smoke tests passed"

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]