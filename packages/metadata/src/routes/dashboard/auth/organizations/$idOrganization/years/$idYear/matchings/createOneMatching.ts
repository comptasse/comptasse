import * as v from "valibot"
import { routePath } from "../../../../../../../../components/index.js"
import { entryLineSchema } from "../../../../../../../../schemas/entryLine.js"
import { matchingSchema, matchingSchemaReturn } from "../../../../../../../../schemas/matching.js"
import { routeDefinition } from "../../../../../../../../utilities/routeDefinition.js"

export const createOneMatchingRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/matchings`,
    name: "create-one-matching",
    schemas: {
        body: v.object({
            idYear: matchingSchema.entries.idYear,
            idAccount: matchingSchema.entries.idAccount,
            entryLineIds: v.array(entryLineSchema.entries.id, "Au moins un mouvement est requis"),
        }),
        return: matchingSchemaReturn,
    },
})
