import { models, readOneTagRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../utilities/sql/selectMany.js"

export const readOneTagRoute = registerRoute(readOneTagRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: readOneTagRouteDefinition.schemas.body,
    })

    const tags = await selectMany({
        database: c.var.clients.sql,
        table: models.tag,
        where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idTag)),
    })
    const tag = tags.at(0)
    if (tag === undefined) {
        throw new Exception({
            statusCode: 400,
            internalMessage: "Tag not found",
            externalMessage: "Catégorie introuvable",
        })
    }

    const tagYears = await selectMany({
        database: c.var.clients.sql,
        table: models.tagYear,
        where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.idTag, tag.id)),
    })

    return response({
        context: c,
        statusCode: 200,
        schema: readOneTagRouteDefinition.schemas.return,
        data: {
            ...tag,
            idYearIds: tagYears.map((tagYear) => tagYear.idYear),
        },
    })
})
