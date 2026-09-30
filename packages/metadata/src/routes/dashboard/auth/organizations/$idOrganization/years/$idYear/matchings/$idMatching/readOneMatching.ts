import * as v from "valibot"
import { routePath } from "../../../../../../../../../components/index.js"
import { matchingSchema, matchingSchemaReturn } from "../../../../../../../../../schemas/matching.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const readOneMatchingRouteDefinition = routeDefinition({
    protocol: "http",
    method: "GET",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/matchings/:idMatching`,
    name: "read-one-matching",
    schemas: {
        body: v.object({
            idYear: matchingSchema.entries.idYear,
            idMatching: matchingSchema.entries.id,
        }),
        return: matchingSchemaReturn,
    },
})
