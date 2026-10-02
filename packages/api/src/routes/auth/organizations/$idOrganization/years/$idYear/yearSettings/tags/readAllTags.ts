import { models, readAllTagsRouteDefinition } from "@comptasse/application-metadata"
import { and, eq, inArray } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"

export const readAllTagsRoute = registerRoute(readAllTagsRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: readAllTagsRouteDefinition.schemas.body,
    })

    // Categories are organization-scoped: a year's categories are the tags linked
    // to it through `table_tag_year`.
    const tagYears = await selectMany({
        database: c.var.clients.sql,
        table: models.tagYear,
        where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.idYear, body.idYear)),
    })

    const readAllTags =
        tagYears.length === 0
            ? []
            : await selectMany({
                  database: c.var.clients.sql,
                  table: models.tag,
                  where: (table) =>
                      and(
                          eq(table.idOrganization, idOrganization),
                          inArray(
                              table.id,
                              tagYears.map((tagYear) => tagYear.idTag),
                          ),
                      ),
              })

    return response({
        context: c,
        statusCode: 200,
        schema: readAllTagsRouteDefinition.schemas.return,
        data: readAllTags,
    })
})
