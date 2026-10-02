import * as v from "valibot"
import { idSchema, routePath } from "../../../../../../components/index.js"
import { tagSchema, tagSchemaReturnWithYears } from "../../../../../../schemas/tag.js"
import { routeDefinition } from "../../../../../../utilities/routeDefinition.js"

export const createOneOrganizationTagRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/tags`,
    name: "create-one-organization-tag",
    schemas: {
        body: v.object({
            label: tagSchema.entries.label,
            idYearIds: v.optional(v.array(idSchema)),
        }),
        return: tagSchemaReturnWithYears,
    },
})
