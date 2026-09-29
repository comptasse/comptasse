# ==============================================================================
# Website Development Dockerfile
# ==============================================================================
# Minimal Node.js + PNPM image for running the website dev server.
# The full workspace (including node_modules) is bind-mounted at runtime.
# Dependencies must be installed on the host before starting.
#
# Environment variables are set in compose.yml and injected directly via
# process.env (Vite reads VITE_* from process.env).
# ==============================================================================

ARG NODE_VERSION="25.2.1"
ARG PNPM_VERSION="11.28.2"

FROM node:${NODE_VERSION}-bullseye-slim

ARG PNPM_VERSION

# Install PNPM
RUN npm install -g "pnpm@${PNPM_VERSION}"

WORKDIR /workspace/packages/website

# Run Panda codegen, then start Vite (env vars come from process.env via Compose)
CMD ["sh", "-c", "cd /workspace/packages/ui && pnpm panda codegen && cd /workspace/packages/website && pnpm panda codegen && pnpm dev -- --host 0.0.0.0"]
