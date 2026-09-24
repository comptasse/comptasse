import * as v from "valibot"
import { routePath } from "../../../../../../../../../../components/index.js"
import { entryLineSchema, entryLineSchemaReturn } from "../../../../../../../../../../schemas/entryLine.js"
import { routeDefinition } from "../../../../../../../../../../utilities/routeDefinition.js"

export const readAllEntryLinesRouteDefinition = routeDefinition({
    protocol: "http",
    method: "GET",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries/lines`,
    name: "read-all-entry-lines",
    schemas: {
        body: v.object({
            idYear: entryLineSchema.entries.idYear,
            idEntry: v.optional(entryLineSchema.entries.idEntry),
        }),
        return: v.array(entryLineSchemaReturn),
    },
})
