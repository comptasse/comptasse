import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { modelSchemas } from "@comptasse/application-metadata"
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api"

const repoDrizzleDir = fileURLToPath(new URL("../drizzle", import.meta.url))
const defaultBaseline = fileURLToPath(new URL("../drizzle/meta/_snapshot.json", import.meta.url))

const outDir = process.env.MIGRATIONS_OUT || repoDrizzleDir
const baselinePath = process.env.MIGRATIONS_BASELINE || defaultBaseline
const setupFile = "0000_setup.sql"
const deltaFile = "0001_from_last_update.sql"

function toSqlFile(statements: string[]) {
    const body = statements
        .flatMap((statement) => {
            const trimmed = statement.trim()
            if (!trimmed) return []
            return [
                trimmed.endsWith(";") ? trimmed : `${trimmed};`,
            ]
        })
        .join("\n\n")
    return body ? `${body}\n` : ""
}

const cur = generateDrizzleJson(modelSchemas)

const setup = await generateMigration(generateDrizzleJson({}), cur)

let delta: string[] = []
if (existsSync(baselinePath)) {
    const prev = JSON.parse(readFileSync(baselinePath, "utf8"))
    delta = await generateMigration(prev, cur)
} else {
    console.warn(`[generateMigrations] No baseline snapshot found at ${baselinePath} - writing empty delta`)
}

mkdirSync(outDir, {
    recursive: true,
})
writeFileSync(`${outDir}/${setupFile}`, toSqlFile(setup))
writeFileSync(`${outDir}/${deltaFile}`, toSqlFile(delta))

console.log(`[generateMigrations] setup: ${setup.length} statements, delta: ${delta.length} statements`)
console.log(`[generateMigrations] wrote ${setupFile} and ${deltaFile} to ${outDir}`)
