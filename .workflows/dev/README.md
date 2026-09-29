# Development Environment

Docker-based development environment for the Comptasse application.

## Architecture

```
.workflows/dev/
├── compose.yml              # Docker Compose config (services + env vars)
├── up.sh                    # Dev startup script (port allocation + compose up)
├── .dockerignore            # Build context exclusions
└── packages/
    ├── api/
    │   ├── Dockerfile       # API service image
    │   ├── entrypoint.sh    # API startup script (generates .env files)
    │   ├── migrate.sh       # Database migration script
    │   ├── seed.sh          # Database seed script
    │   └── start.sh         # API start script
    └── website/
        └── Dockerfile       # Website service image
```

## Key Concepts

### Full Workspace Volume Mount
- The **entire workspace** (including `node_modules`) is bind-mounted from host
- Dependencies must be installed on the host (`pnpm install`) before starting
- Changes on either host or container are instantly synced
- No separate dependency installation inside containers

### Networking
- The API container uses `network_mode: host`, sharing the host
  network stack directly.
- All services are reached via `localhost:<PORT>` - the same address works
  inside containers, in the browser, and in local dev tools.
- Infrastructure services (Postgres, RustFS) are published on
  `127.0.0.1:<RANDOM_PORT>`.

### Port Allocation
- `just dev up` assigns random 5-digit host ports for all exposed services.
- The first generated values are saved in `.workflows/dev/.ports`.
- Subsequent runs reuse saved ports when they are still free.
- If a saved port is occupied, only that specific key is replaced with a new
  random 5-digit free port.
- Startup output always prints the effective `localhost:<PORT>` endpoints.

### Environment Variables
- All environment variables are defined inline in `compose.yml`.
- No `.env` files are used: Compose injects env vars directly into
  containers. Vite reads `VITE_*` from `process.env`.

### Services

**Infrastructure:**
- PostgreSQL (`postgres://postgres:admin@localhost:<POSTGRES_HOST_PORT>/default`)
- Storage S3 API (`http://localhost:<STORAGE_HOST_PORT>`)
- RustFS UI (`http://localhost:<RUSTFS_UI_HOST_PORT>`)

**Applications:**
- API (`http://localhost:<API_HOST_PORT>`)
- Website (`http://localhost:<WEBSITE_HOST_PORT>`)
- Dashboard (`http://localhost:<DASHBOARD_HOST_PORT>`)

## Prerequisites

Before starting the dev environment, install dependencies on the host:

```bash
pnpm install
```

## Usage

### Start all services
```bash
just dev up
```

The command prints effective `localhost:<PORT>` endpoints for every service.

### Rebuild images (after Node.js or PNPM version changes)
```bash
docker compose -f .workflows/dev/compose.yml build
just dev up
```

### View logs
```bash
# All services
docker compose -f .workflows/dev/compose.yml logs -f

# Specific service
docker compose -f .workflows/dev/compose.yml logs -f api
```

### Stop services
```bash
just dev down
```

### Reset database
```bash
just dev reset
```

## How It Works

1. **Build Phase:**
   - Dockerfiles create minimal images with Node.js + PNPM
   - No source code or dependencies are copied during build
   - Images are lightweight and rarely need rebuilding

2. **Runtime Phase:**
   - Full workspace bind-mounted to `/workspace` (including `node_modules`)
   - Environment variables are injected directly by Compose
   - API entrypoint runs the schema check and starts the dev server
   - Website and dashboard containers start their Vite dev servers

3. **Development:**
   - Install/update dependencies on host with `pnpm install`
   - Edit code on host with your IDE
   - Changes instantly reflected in containers
   - Vite HMR updates browser automatically
   - No manual container restarts needed for code changes

## Troubleshooting

### Port already in use
```bash
# Check what's using the port
lsof -i :3000
```

### Dependencies out of sync
```bash
# Run on host
pnpm install

# Restart containers to pick up changes
docker compose -f .workflows/dev/compose.yml restart api
```

### Database reset
```bash
# Remove database volume (WARNING: deletes all data)
docker compose -f .workflows/dev/compose.yml down
docker volume rm application_postgres_data
docker compose -f .workflows/dev/compose.yml up -d
```

### Clean slate
```bash
# Remove all containers and volumes, then rebuild
docker compose -f .workflows/dev/compose.yml down -v
docker compose -f .workflows/dev/compose.yml up -d --build
```
