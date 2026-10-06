import * as v from "valibot"
import { routePath } from "../../../../../../../../components/index.js"
import { blobSchema } from "../../../../../../../../components/schemas/blobSchema.js"
import { fileSchema, fileSchemaReturn } from "../../../../../../../../schemas/file.js"
import { routeDefinition } from "../../../../../../../../utilities/routeDefinition.js"

export const createOneFileRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/files`,
    name: "create-one-file",
    schemas: {
        body: v.object({
            idFolder: v.optional(fileSchema.entries.idFolder),
            reference: fileSchema.entries.reference,
            name: fileSchema.entries.name,
            description: v.optional(fileSchema.entries.description),
            hash: fileSchema.entries.hash,
            file: v.optional(blobSchema),
        }),
        return: fileSchemaReturn,
    },
})
