import { createOneOrganizationTagRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { checkAuthMiddleware } from "../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../utilities/registerRoute.js"
import { response } from "../../../../../utilities/response.js"
import { insertOne } from "../../../../../utilities/sql/insertOne.js"

export const createOneOrganizationTagRoute = registerRoute(createOneOrganizationTagRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: createOneOrganizationTagRouteDefinition.schemas.body,
    })
    const idYearIds = body.idYearIds ?? []

    const tag = await c.var.clients.sql.transaction(async (tx) => {
        const createdTag = await insertOne({
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

        for (const idYear of idYearIds) {
            await insertOne({
                database: tx,
                table: models.tagYear,
                data: {
                    id: generateId(),
                    idOrganization: idOrganization,
                    idYear: idYear,
                    idTag: createdTag.id,
                    createdAt: new Date().toISOString(),
                },
            })
        }

        return createdTag
    })

    return response({
        context: c,
        statusCode: 200,
        schema: createOneOrganizationTagRouteDefinition.schemas.return,
        data: {
            ...tag,
            idYearIds: idYearIds,
        },
    })
})
