import { models, updateManyEntriesRouteDefinition } from "@comptasse/application-metadata"
import { and, eq, inArray } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../../utilities/sql/updateOne.js"

export const updateManyEntriesRoute = registerRoute(updateManyEntriesRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: updateManyEntriesRouteDefinition.schemas.body,
    })

    const entries = await c.var.clients.sql.transaction(async (tx) => {
        const readAllEntries = await selectMany({
            database: tx,
            table: models.entry,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    inArray(table.id, body.idEntryIds),
                ),
        })

        const updatedEntries = []
        for (const entry of readAllEntries) {
            const updatedEntry = await updateOne({
                database: tx,
                table: models.entry,
                data: {
                    isCleared: body.isCleared,
                    lastUpdatedAt: new Date().toISOString(),
                    lastUpdatedBy: auth.user.id,
                },
                where: (table) =>
                    and(
                        eq(table.idOrganization, idOrganization),
                        eq(table.idYear, body.idYear),
                        eq(table.id, entry.id),
                    ),
            })
            updatedEntries.push(updatedEntry)
        }

        return updatedEntries
    })

    return response({
        context: c,
        statusCode: 200,
        schema: updateManyEntriesRouteDefinition.schemas.return,
        data: entries,
    })
})
