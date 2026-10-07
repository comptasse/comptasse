import { models, updateOneEntryRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { updateOne } from "../../../../../../../../utilities/sql/updateOne.js"

export const updateOneEntryRoute = registerRoute(updateOneEntryRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: updateOneEntryRouteDefinition.schemas.body,
    })

    const updatedEntry = await c.var.clients.sql.transaction(async (tx) => {
        const updatedEntry = await updateOne({
            database: tx,
            table: models.entry,
            data: {
                idJournal: body.idJournal,
                idFile: body.idFile,
                label: body.label,
                description: body.description,
                isCleared: body.isCleared,
                date: body.date,
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: auth.user.id,
            },
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.id, body.idEntry),
                ),
        })

        return updatedEntry
    })

    return response({
        context: c,
        statusCode: 200,
        schema: updateOneEntryRouteDefinition.schemas.return,
        data: updatedEntry,
    })
})
