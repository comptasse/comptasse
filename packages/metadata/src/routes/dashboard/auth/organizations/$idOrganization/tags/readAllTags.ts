import * as v from "valibot"
import { routePath } from "../../../../../../components/index.js"
import { tagSchemaReturnWithYears } from "../../../../../../schemas/tag.js"
import { routeDefinition } from "../../../../../../utilities/routeDefinition.js"

export const readAllOrganizationTagsRouteDefinition = routeDefinition({
    protocol: "http",
    method: "GET",
    path: `${routePath.v1}/organizations/:idOrganization/tags`,
    name: "read-all-organization-tags",
    schemas: {
        body: v.object({}),
        return: v.array(tagSchemaReturnWithYears),
    },
})
