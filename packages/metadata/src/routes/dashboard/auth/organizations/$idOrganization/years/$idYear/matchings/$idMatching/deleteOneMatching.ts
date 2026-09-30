import * as v from "valibot"
import { routePath } from "../../../../../../../../../components/index.js"
import { matchingSchema } from "../../../../../../../../../schemas/matching.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const deleteOneMatchingRouteDefinition = routeDefinition({
    protocol: "http",
    method: "DELETE",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/matchings/:idMatching`,
    name: "delete-one-matching",
    schemas: {
        body: v.object({
            idYear: matchingSchema.entries.idYear,
            idMatching: matchingSchema.entries.id,
        }),
        return: v.object({}),
    },
})
