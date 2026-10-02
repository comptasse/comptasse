import { models, readAllOrganizationTagsRouteDefinition } from "@comptasse/application-metadata"
import { eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../middlewares/requireOrganizationMiddleware.js"
import { registerRoute } from "../../../../../utilities/registerRoute.js"
import { response } from "../../../../../utilities/response.js"
import { selectMany } from "../../../../../utilities/sql/selectMany.js"

export const readAllOrganizationTagsRoute = registerRoute(readAllOrganizationTagsRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })

    const tags = await selectMany({
        database: c.var.clients.sql,
        table: models.tag,
        where: (table) => eq(table.idOrganization, idOrganization),
    })
    const tagYears = await selectMany({
        database: c.var.clients.sql,
        table: models.tagYear,
        where: (table) => eq(table.idOrganization, idOrganization),
    })

    const yearIdsByTagId = new Map<string, Array<string>>()
    for (const tagYear of tagYears) {
        const yearIds = yearIdsByTagId.get(tagYear.idTag) ?? []
        yearIds.push(tagYear.idYear)
        yearIdsByTagId.set(tagYear.idTag, yearIds)
    }

    const readAllTags = tags.map((tag) => ({
        ...tag,
        idYearIds: yearIdsByTagId.get(tag.id) ?? [],
    }))

    return response({
        context: c,
        statusCode: 200,
        schema: readAllOrganizationTagsRouteDefinition.schemas.return,
        data: readAllTags,
    })
})
