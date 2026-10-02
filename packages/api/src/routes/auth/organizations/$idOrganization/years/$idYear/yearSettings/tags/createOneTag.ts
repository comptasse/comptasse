import { createOneTagRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { insertOne } from "../../../../../../../../utilities/sql/insertOne.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"

export const createOneTagRoute = registerRoute(createOneTagRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: createOneTagRouteDefinition.schemas.body,
    })

    // Categories are organization-scoped: reuse an existing tag with the same
    // label and just link it to the year (creating it first if needed).
    const tag = await c.var.clients.sql.transaction(async (tx) => {
        const existingTags = await selectMany({
            database: tx,
            table: models.tag,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.label, body.label)),
        })

        let tag = existingTags.at(0)
        if (tag === undefined) {
            tag = await insertOne({
                database: tx,
                table: models.tag,
                data: {
                    id: generateId(),
                    idOrganization: idOrganization,
                    label: body.label,

                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: null,
                    createdBy: auth.user.id,
                    lastUpdatedBy: null,
                },
            })
        }

        const existingLinks = await selectMany({
            database: tx,
            table: models.tagYear,
            where: (table) =>
                and(eq(table.idOrganization, idOrganization), eq(table.idYear, body.idYear), eq(table.idTag, tag!.id)),
        })
        if (existingLinks.length === 0) {
            await insertOne({
                database: tx,
                table: models.tagYear,
                data: {
                    id: generateId(),
                    idOrganization: idOrganization,
                    idYear: body.idYear,
                    idTag: tag!.id,
                    createdAt: new Date().toISOString(),
                },
            })
        }

        return tag
    })

    return response({
        context: c,
        statusCode: 200,
        schema: createOneTagRouteDefinition.schemas.return,
        data: tag,
    })
})
