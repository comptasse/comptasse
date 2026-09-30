import * as v from "valibot"
import { routePath } from "../../../../../../../../components/index.js"
import { matchingSchema, matchingSchemaReturn } from "../../../../../../../../schemas/matching.js"
import { routeDefinition } from "../../../../../../../../utilities/routeDefinition.js"

export const readAllMatchingsRouteDefinition = routeDefinition({
    protocol: "http",
    method: "GET",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/matchings`,
    name: "read-all-matchings",
    schemas: {
        body: v.object({
            idYear: matchingSchema.entries.idYear,
        }),
        return: v.array(matchingSchemaReturn),
    },
})
