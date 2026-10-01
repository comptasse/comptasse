import * as v from "valibot"
import { routePath } from "../../../../../../../../../components/index.js"
import { matchingSchema, matchingSchemaReturn } from "../../../../../../../../../schemas/matching.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const updateOneMatchingRouteDefinition = routeDefinition({
    protocol: "http",
    method: "PATCH",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/matchings/:idMatching`,
    name: "update-one-matching",
    schemas: {
        body: v.object({
            idYear: matchingSchema.entries.idYear,
            idMatching: matchingSchema.entries.id,
            code: matchingSchema.entries.code,
        }),
        return: matchingSchemaReturn,
    },
})
