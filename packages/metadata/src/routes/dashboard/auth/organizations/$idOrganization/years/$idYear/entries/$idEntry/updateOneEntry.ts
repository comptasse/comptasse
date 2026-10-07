import * as v from "valibot"
import { routePath } from "../../../../../../../../../components/index.js"
import { entrySchema, entrySchemaReturn } from "../../../../../../../../../schemas/entry.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const updateOneEntryRouteDefinition = routeDefinition({
    protocol: "http",
    method: "PATCH",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries/:idEntry`,
    name: "update-one-entry",
    schemas: {
        body: v.object({
            idEntry: entrySchema.entries.id,
            idYear: entrySchema.entries.idYear,
            idJournal: v.optional(entrySchema.entries.idJournal),
            idFile: v.optional(entrySchema.entries.idFile),
            label: v.optional(entrySchema.entries.label),
            description: v.optional(entrySchema.entries.description),
            isCleared: v.optional(entrySchema.entries.isCleared),
            date: v.optional(entrySchema.entries.date),
        }),
        return: entrySchemaReturn,
    },
})
