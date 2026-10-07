import * as v from "valibot"
import { routePath } from "../../../../../../../../../components/index.js"
import { blobSchema } from "../../../../../../../../../components/schemas/blobSchema.js"
import { fileSchema, fileSchemaReturn } from "../../../../../../../../../schemas/file.js"
import { routeDefinition } from "../../../../../../../../../utilities/routeDefinition.js"

export const updateOneFileRouteDefinition = routeDefinition({
    protocol: "http",
    method: "PATCH",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/files/:idFile`,
    name: "update-one-file",
    schemas: {
        body: v.object({
            idFile: fileSchema.entries.id,
            reference: v.optional(fileSchema.entries.reference),
            name: v.optional(fileSchema.entries.name),
            description: v.optional(fileSchema.entries.description),
            date: v.optional(fileSchema.entries.date),
            idFolder: v.optional(fileSchema.entries.idFolder),
            file: v.optional(blobSchema),
        }),
        return: fileSchemaReturn,
    },
})
