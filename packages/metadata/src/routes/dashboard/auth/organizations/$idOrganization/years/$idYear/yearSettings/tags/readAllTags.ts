import * as v from "valibot"
import { idSchema, routePath } from "../../../../../../../../../components/index.js"
import { tagSchemaReturn } from "../../../../../../../../../schemas/tag.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const readAllTagsRouteDefinition = routeDefinition({
    protocol: "http",
    method: "GET",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/tags`,
    name: "read-all-tags",
    schemas: {
        body: v.object({
            idYear: idSchema,
        }),
        return: v.array(tagSchemaReturn),
    },
})
