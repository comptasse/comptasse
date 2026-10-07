import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { modelSchemas } from "@comptasse/application-metadata"
import { generateDrizzleJson } from "drizzle-kit/api"

const baselinePath =
    process.env.MIGRATIONS_BASELINE || fileURLToPath(new URL("../drizzle/meta/_snapshot.json", import.meta.url))

const snapshot = generateDrizzleJson(modelSchemas)

mkdirSync(baselinePath.replace(/\/[^/]+$/, ""), {
    recursive: true,
})
writeFileSync(baselinePath, JSON.stringify(snapshot, null, 2))
console.log(`[saveSnapshot] wrote baseline snapshot to ${baselinePath}`)
