import * as v from "valibot"
import { routePath } from "../../../../../../../../components/index.js"
import { entrySchema, entrySchemaReturn } from "../../../../../../../../schemas/entry.js"
import { routeDefinition } from "../../../../../../../../utilities/routeDefinition.js"

export const updateManyEntriesRouteDefinition = routeDefinition({
    protocol: "http",
    method: "PATCH",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries`,
    name: "update-many-entries",
    schemas: {
        body: v.object({
            idYear: entrySchema.entries.idYear,
            idEntryIds: v.array(entrySchema.entries.id, "Au moins une écriture est requise"),
            isCleared: entrySchema.entries.isCleared,
        }),
        return: v.array(entrySchemaReturn),
    },
})
