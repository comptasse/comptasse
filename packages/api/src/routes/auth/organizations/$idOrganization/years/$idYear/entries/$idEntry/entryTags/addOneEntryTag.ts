import { addOneEntryTagRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../../utilities/response.js"
import { insertOne } from "../../../../../../../../../utilities/sql/insertOne.js"
import { selectOne } from "../../../../../../../../../utilities/sql/selectOne.js"

export const addOneEntryTagRoute = registerRoute(addOneEntryTagRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: addOneEntryTagRouteDefinition.schemas.body,
    })

    // Verify entry exists
    await selectOne({
        database: c.var.clients.sql,
        table: models.entry,
        where: (table) =>
            and(eq(table.idOrganization, idOrganization), eq(table.idYear, body.idYear), eq(table.id, body.idEntry)),
    })

    // Verify tag exists (categories are organization-scoped)
    await selectOne({
        database: c.var.clients.sql,
        table: models.tag,
        where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idTag)),
    })

    const addOneEntryTag = await insertOne({
        database: c.var.clients.sql,
        table: models.entryTag,
        data: {
            id: generateId(),
            idOrganization: idOrganization,
            idYear: body.idYear,
            idEntry: body.idEntry,
            idTag: body.idTag,
            createdAt: new Date().toISOString(),
        },
    })

    return response({
        context: c,
        statusCode: 200,
        schema: addOneEntryTagRouteDefinition.schemas.return,
        data: addOneEntryTag,
    })
})
