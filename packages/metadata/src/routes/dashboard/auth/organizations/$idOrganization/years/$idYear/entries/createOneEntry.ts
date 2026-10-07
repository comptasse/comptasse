import * as v from "valibot"
import { routePath } from "../../../../../../../../components/index.js"
import { entrySchema, entrySchemaReturn } from "../../../../../../../../schemas/entry.js"
import { routeDefinition } from "../../../../../../../../utilities/routeDefinition.js"

export const createOneEntryRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries`,
    name: "create-one-entry",
    schemas: {
        body: v.object({
            idYear: entrySchema.entries.idYear,
            idJournal: v.optional(entrySchema.entries.idJournal),
            idFile: v.optional(entrySchema.entries.idFile),
            label: entrySchema.entries.label,
            description: v.optional(entrySchema.entries.description),
            date: entrySchema.entries.date,
        }),
        return: entrySchemaReturn,
    },
})
