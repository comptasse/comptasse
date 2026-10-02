import * as v from "valibot"
import { idSchema, routePath } from "../../../../../../../components/index.js"
import { tagSchema, tagSchemaReturnWithYears } from "../../../../../../../schemas/tag.js"
import { routeDefinition } from "../../../../../../../utilities/routeDefinition.js"

export const updateOneTagRouteDefinition = routeDefinition({
    protocol: "http",
    method: "PATCH",
    path: `${routePath.v1}/organizations/:idOrganization/tags/:idTag`,
    name: "update-one-tag",
    schemas: {
        body: v.object({
            idTag: tagSchema.entries.id,
            label: v.optional(tagSchema.entries.label),
            idYearIds: v.optional(v.array(idSchema)),
        }),
        return: tagSchemaReturnWithYears,
    },
})
