# ==============================================================================
# Comptasse Dashboard Docker Image
# ==============================================================================
# Builds the dashboard SPA (Vite) and serves it with nginx.
#
# Environment variables (injected at runtime, not baked at build time):
#   API_BASE_URL             API base URL used by the browser. Default: /api
#                            (proxied by nginx to the api service). Set it to an
#                            absolute URL (e.g. https://api.arrhes.com) when the
#                            dashboard is served from a different origin.
#
# On startup the entrypoint renders /config.js from API_BASE_URL so a single
# image can be deployed to any installation without rebuilding.
# ==============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build
# ---------------------------------------------------------------------------
FROM node:25.2.1-alpine AS base
RUN npm install -g pnpm@11.28.2
ENV NODE_OPTIONS="--max-old-space-size=4096"

FROM base AS build
WORKDIR /root
COPY . .
RUN pnpm install

RUN pnpm --filter @comptasse/dashboard... run build

# ---------------------------------------------------------------------------
# Stage 2: Runtime (nginx)
# ---------------------------------------------------------------------------
FROM nginx:alpine AS deploy
COPY .workflows/build/packages/dashboard/nginx/default.conf /etc/nginx/nginx.conf
COPY .workflows/build/packages/dashboard/nginx/config.template.js /config.template.js
COPY .workflows/build/packages/dashboard/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /root/packages/dashboard/build /usr/share/nginx/html

# Build-time smoke tests
RUN nginx -t && \
    test -f /usr/share/nginx/html/index.html && \
    sh -n /entrypoint.sh && \
    echo "Dashboard smoke tests passed"

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]