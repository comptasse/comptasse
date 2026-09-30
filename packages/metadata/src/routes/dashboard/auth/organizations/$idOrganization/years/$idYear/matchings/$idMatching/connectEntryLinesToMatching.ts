import * as v from "valibot"
import { routePath } from "../../../../../../../../../components/index.js"
import { entryLineSchema, entryLineSchemaReturn } from "../../../../../../../../../schemas/entryLine.js"
import { matchingSchema } from "../../../../../../../../../schemas/matching.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const connectEntryLinesToMatchingRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/matchings/:idMatching/lines`,
    name: "connect-entry-lines-to-matching",
    schemas: {
        body: v.object({
            idYear: matchingSchema.entries.idYear,
            idMatching: matchingSchema.entries.id,
            entryLineIds: v.array(entryLineSchema.entries.id, "Au moins un mouvement est requis"),
        }),
        return: v.array(entryLineSchemaReturn),
    },
})
