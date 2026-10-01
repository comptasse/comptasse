import { generateId, models, updateOneFileRouteDefinition } from "@comptasse/application-metadata"
import { and, eq, sql } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { selectOne } from "../../../../../../../../utilities/sql/selectOne.js"
import { updateOne } from "../../../../../../../../utilities/sql/updateOne.js"
import { deleteObject } from "../../../../../../../../utilities/storage/deleteObject.js"
import { putObject } from "../../../../../../../../utilities/storage/putObject.js"

const UPDATEABLE_FILE_FIELDS = [
    "reference",
    "name",
    "date",
    "idFolder",
] as const

export const updateOneFileRoute = registerRoute(updateOneFileRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })

    const contentType = c.req.header("content-type") ?? ""

    // Only fields actually provided are updated, so a partial update (e.g. moving
    // a file to another folder) never wipes the others (name, date, reference).
    const providedFields: Record<string, unknown> = {}
    let file: File | null = null

    let idFile: string

    if (contentType.includes("multipart/form-data")) {
        const formData = await c.req.formData()
        idFile = c.req.param("idFile") ?? ""
        for (const key of UPDATEABLE_FILE_FIELDS) {
            if (formData.has(key)) providedFields[key] = formData.get(key)?.toString() || null
        }
        file = formData.get("file") as File | null
    } else {
        const body = await validateBodyMiddleware({
            context: c,
            schema: updateOneFileRouteDefinition.schemas.body,
        })
        idFile = body.idFile
        for (const key of UPDATEABLE_FILE_FIELDS) {
            if (Object.hasOwn(body, key)) providedFields[key] = body[key] ?? null
        }
    }

    const updateData: Record<string, unknown> = {
        ...providedFields,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: auth.user.id,
    }

    const updatedFile = await c.var.clients.sql.transaction(async (tx) => {
        if (file && file.size > 0) {
            const existing = await selectOne({
                database: tx,
                table: models.file,
                where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, idFile)),
            })

            if (existing.storageKey) {
                await deleteObject({
                    var: c.var,
                    storageKey: existing.storageKey,
                }).catch(() => {})
            }

            if (existing.size !== null && existing.size > 0) {
                await updateOne({
                    database: tx,
                    table: models.organization,
                    data: {
                        storageCurrentUsage: sql`GREATEST(${models.organization.storageCurrentUsage} - ${existing.size}, 0)`,
                    },
                    where: (table) => eq(table.id, idOrganization),
                })
            }

            const storageKey = `organizations/${idOrganization}/storage/${generateId()}`
            const fileType = file.type || "application/octet-stream"
            const buffer = Buffer.from(await file.arrayBuffer())

            await putObject({
                var: c.var,
                storageKey,
                contentLength: file.size,
                contentType: fileType,
                metadata: {
                    idOrganization,
                    idUser: auth.user.id,
                },
                body: buffer,
            })

            updateData.storageKey = storageKey
            updateData.type = fileType
            updateData.size = file.size
        }

        const updated = await updateOne({
            database: tx,
            table: models.file,
            data: updateData as Record<string, unknown>,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, idFile)),
        })

        if (file && file.size > 0) {
            await updateOne({
                database: tx,
                table: models.organization,
                data: {
                    storageCurrentUsage: sql`${models.organization.storageCurrentUsage} + ${file.size}`,
                },
                where: (table) => eq(table.id, idOrganization),
            })
        }

        return updated
    })

    return response({
        context: c,
        statusCode: 200,
        schema: updateOneFileRouteDefinition.schemas.return,
        data: updatedFile,
    })
})
