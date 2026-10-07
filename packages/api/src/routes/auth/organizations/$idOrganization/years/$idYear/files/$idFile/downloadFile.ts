import { downloadFileRouteDefinition, models } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { selectOne } from "../../../../../../../../utilities/sql/selectOne.js"
import { getObject } from "../../../../../../../../utilities/storage/getObject.js"

export const downloadFileRoute = registerRoute(downloadFileRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: downloadFileRouteDefinition.schemas.body,
    })

    const fileRecord = await selectOne({
        database: c.var.clients.sql,
        table: models.file,
        where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idFile)),
    })

    if (!fileRecord.storageKey) {
        throw new Exception({
            statusCode: 404,
            internalMessage: "File has no storage key",
            externalMessage: "Le fichier n'a pas de contenu associé",
        })
    }

    const storageResponse = await getObject({
        var: c.var,
        storageKey: fileRecord.storageKey,
    })

    const fileBytes = await storageResponse.Body?.transformToByteArray()
    if (!fileBytes) {
        throw new Exception({
            statusCode: 500,
            internalMessage: "Failed to read file from storage",
            externalMessage: "Impossible de lire le fichier depuis le stockage",
        })
    }

    const contentType = fileRecord.type ?? "application/octet-stream"
    const contentDisposition = `inline; filename="${fileRecord.name ?? "file"}"`

    return new Response(Buffer.from(fileBytes), {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Content-Disposition": contentDisposition,
            "Content-Length": String(fileBytes.length),
        },
    })
})
