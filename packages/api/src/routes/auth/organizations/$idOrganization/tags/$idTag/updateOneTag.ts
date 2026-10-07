import { generateId, models, updateOneTagRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../utilities/response.js"
import { deleteMany } from "../../../../../../utilities/sql/deleteMany.js"
import { insertMany } from "../../../../../../utilities/sql/insertMany.js"
import { selectMany } from "../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../utilities/sql/updateOne.js"

export const updateOneTagRoute = registerRoute(updateOneTagRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: updateOneTagRouteDefinition.schemas.body,
    })

    const updatedTag = await c.var.clients.sql.transaction(async (tx) => {
        const existingTags = await selectMany({
            database: tx,
            table: models.tag,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idTag)),
        })
        if (existingTags.length === 0) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Tag not found",
                externalMessage: "Catégorie introuvable",
            })
        }

        if (body.label !== undefined) {
            await updateOne({
                database: tx,
                table: models.tag,
                data: {
                    label: body.label,
                    lastUpdatedAt: new Date().toISOString(),
                    lastUpdatedBy: auth.user.id,
                },
                where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idTag)),
            })
        }

        if (body.idYearIds !== undefined) {
            await deleteMany({
                database: tx,
                table: models.tagYear,
                where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.idTag, body.idTag)),
            })
            if (body.idYearIds.length > 0) {
                await insertMany({
                    database: tx,
                    table: models.tagYear,
                    data: body.idYearIds.map((idYear) => ({
                        id: generateId(),
                        idOrganization: idOrganization,
                        idYear: idYear,
                        idTag: body.idTag,
                        createdAt: new Date().toISOString(),
                    })),
                })
            }
        }

        const updatedTags = await selectMany({
            database: tx,
            table: models.tag,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idTag)),
        })
        const tagYears = await selectMany({
            database: tx,
            table: models.tagYear,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.idTag, body.idTag)),
        })

        return {
            ...updatedTags[0]!,
            idYearIds: tagYears.map((tagYear) => tagYear.idYear),
        }
    })

    return response({
        context: c,
        statusCode: 200,
        schema: updateOneTagRouteDefinition.schemas.return,
        data: updatedTag,
    })
})
