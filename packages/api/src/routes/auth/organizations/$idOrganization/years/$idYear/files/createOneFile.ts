import { createOneFileRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { and, eq, sql } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { Exception } from "../../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../utilities/response.js"
import { insertOne } from "../../../../../../../utilities/sql/insertOne.js"
import { selectMany } from "../../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../../utilities/sql/updateOne.js"
import { putObject } from "../../../../../../../utilities/storage/putObject.js"

export const createOneFileRoute = registerRoute(createOneFileRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })

    const formData = await c.req.formData()

    const name = formData.get("name")?.toString() ?? ""
    const description = formData.get("description")?.toString() ?? null
    const reference = formData.get("reference")?.toString() ?? null
    const hash = formData.get("hash")?.toString() ?? null
    const idFolder = formData.get("idFolder")?.toString() ?? null
    const file = formData.get("file") as File | null

    if (!file) {
        throw new Exception({
            statusCode: 400,
            internalMessage: "File content is required",
            externalMessage: "Le contenu du fichier est requis",
        })
    }

    if (hash) {
        const existingFiles = await selectMany({
            database: c.var.clients.sql,
            table: models.file,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.hash, hash)),
        })
        if (existingFiles.length > 0) {
            throw new Exception({
                statusCode: 409,
                internalMessage: "File already exists",
                externalMessage: "Ce fichier existe déjà",
            })
        }
    }

    const storageKey = `organizations/${idOrganization}/storage/${generateId()}`
    const contentType = file.type || "application/octet-stream"
    const size = file.size
    const buffer = Buffer.from(await file.arrayBuffer())

    await putObject({
        var: c.var,
        storageKey,
        contentLength: size,
        contentType,
        metadata: {
            idOrganization,
            idUser: auth.user.id,
        },
        body: buffer,
    })

    const createdFile = await c.var.clients.sql.transaction(async (tx) => {
        const created = await insertOne({
            database: tx,
            table: models.file,
            data: {
                id: generateId(),
                idOrganization: idOrganization,
                idFolder: idFolder,
                reference: reference,
                name: name,
                description: description,
                storageKey: storageKey,
                type: contentType,
                size: size,
                hash: hash,
                createdAt: new Date().toISOString(),
                lastUpdatedAt: null,
                createdBy: auth.user.id,
                lastUpdatedBy: null,
            },
        })

        await updateOne({
            database: tx,
            table: models.organization,
            data: {
                storageCurrentUsage: sql`${models.organization.storageCurrentUsage} + ${size}`,
            },
            where: (table) => eq(table.id, idOrganization),
        })

        return created
    })

    return response({
        context: c,
        statusCode: 200,
        schema: createOneFileRouteDefinition.schemas.return,
        data: createdFile,
    })
})
