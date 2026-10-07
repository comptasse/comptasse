import * as v from "valibot"
import { routePath } from "../../../../../../../components/index.js"
import { tagSchema, tagSchemaReturnWithYears } from "../../../../../../../schemas/tag.js"
import { routeDefinition } from "../../../../../../../utilities/routeDefinition.js"

export const readOneTagRouteDefinition = routeDefinition({
    protocol: "http",
    method: "GET",
    path: `${routePath.v1}/organizations/:idOrganization/tags/:idTag`,
    name: "read-one-tag",
    schemas: {
        body: v.object({
            idTag: tagSchema.entries.id,
        }),
        return: tagSchemaReturnWithYears,
    },
})
