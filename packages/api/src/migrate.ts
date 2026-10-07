import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import postgres from "postgres"

const databaseUrl = process.env.SQL_DATABASE_URL
if (!databaseUrl) {
    console.error("[migrate] SQL_DATABASE_URL is required")
    process.exit(1)
}

const migrationsDir = process.env.MIGRATIONS_DIR || "/app/migrations"

const sql = postgres(databaseUrl, {
    max: 1,
})

async function main() {
    await sql`create schema if not exists meta`
    await sql`create table if not exists meta._migrations (
        name text primary key,
        applied_at timestamptz not null default now()
    )`

    const files = readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort()
    if (files.length === 0) {
        throw new Error(`No migration files found in ${migrationsDir}`)
    }

    const appliedRows = await sql<
        {
            name: string
        }[]
    >`select name from meta._migrations`
    const applied = new Set(appliedRows.map((row) => row.name))

    const [{ count }] = await sql<
        {
            count: number
        }[]
    >`select count(*)::int as count from information_schema.tables where table_schema = 'public'`
    const isFresh = count === 0

    // 0000_setup.sql must be the first file (sorts before 0001_*)
    const setupFile = files[0]

    for (const file of files) {
        if (applied.has(file)) continue

        if (isFresh && file !== setupFile) {
            // Fresh install: setup.sql contains the full current schema.
            // Record the remaining files as applied without running them.
            await sql`insert into meta._migrations (name) values (${file})`
            continue
        }

        if (!isFresh && file === setupFile) {
            // Existing install: the database predates migrations, assume the
            // schema is current and only run the incremental delta files.
            await sql`insert into meta._migrations (name) values (${file})`
            continue
        }

        const body = readFileSync(join(migrationsDir, file), "utf8").trim()
        if (body) {
            await sql.unsafe(body)
        }
        await sql`insert into meta._migrations (name) values (${file})`
        console.log(`[migrate] applied ${file}`)
    }

    console.log(`[migrate] ${files.length} migration files, database schema is up to date.`)
    await sql.end()
}

main().catch(async (error) => {
    console.error("[migrate] Migration failed:", error)
    try {
        await sql.end()
    } catch {
        // ignore
    }
    process.exit(1)
})
