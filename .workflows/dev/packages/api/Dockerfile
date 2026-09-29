# ==============================================================================
# API Service Dockerfile
# ==============================================================================
# Minimal Node.js + PNPM image for running the API service.
# The full workspace (including node_modules) is bind-mounted at runtime.
# Dependencies must be installed on the host before starting.
# ==============================================================================

ARG NODE_VERSION="25.2.1"
ARG PNPM_VERSION="11.28.2"

FROM node:${NODE_VERSION}-bullseye-slim

ARG PNPM_VERSION

# Install PNPM package manager
RUN npm install -g "pnpm@${PNPM_VERSION}"

# Set working directory
WORKDIR /workspace

# Start via entrypoint script (bind-mounted at runtime)
ENTRYPOINT ["/bin/bash", "/workspace/.workflows/dev/packages/api/entrypoint.sh"]
