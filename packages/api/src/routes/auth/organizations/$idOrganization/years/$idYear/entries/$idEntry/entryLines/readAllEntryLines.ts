import { models, readAllEntryLinesRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../../../utilities/sql/selectMany.js"

export const readAllEntryLinesRoute = registerRoute(readAllEntryLinesRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: readAllEntryLinesRouteDefinition.schemas.body,
    })
    const idEntry = body.idEntry

    const readAllEntryLines = await selectMany({
        database: c.var.clients.sql,
        table: models.entryLine,
        where: (table) => {
            if (idEntry !== null && idEntry !== undefined) {
                return and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.idEntry, idEntry),
                )
            }
            return and(eq(table.idOrganization, idOrganization), eq(table.idYear, body.idYear))
        },
    })

    return response({
        context: c,
        statusCode: 200,
        schema: readAllEntryLinesRouteDefinition.schemas.return,
        data: readAllEntryLines,
    })
})
