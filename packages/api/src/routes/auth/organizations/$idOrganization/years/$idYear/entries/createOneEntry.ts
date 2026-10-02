import { createOneEntryRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { checkAuthMiddleware } from "../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../utilities/response.js"
import { insertOne } from "../../../../../../../utilities/sql/insertOne.js"

export const createOneEntryRoute = registerRoute(createOneEntryRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: createOneEntryRouteDefinition.schemas.body,
    })

    const createOneEntry = await insertOne({
        database: c.var.clients.sql,
        table: models.entry,
        data: {
            id: generateId(),
            idOrganization: idOrganization,
            idYear: body.idYear,
            idJournal: body.idJournal,
            idFile: body.idFile,
            label: body.label,
            description: body.description ?? null,
            date: body.date,
            createdAt: new Date().toISOString(),
            lastUpdatedAt: null,
            createdBy: auth.user.id,
            lastUpdatedBy: null,
        },
    })

    return response({
        context: c,
        statusCode: 200,
        schema: createOneEntryRouteDefinition.schemas.return,
        data: createOneEntry,
    })
})
