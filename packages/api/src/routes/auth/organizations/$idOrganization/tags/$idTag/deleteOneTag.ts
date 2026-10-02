import { deleteOneTagRouteDefinition, models } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../utilities/response.js"
import { deleteOne } from "../../../../../../utilities/sql/deleteOne.js"

export const deleteOneTagRoute = registerRoute(deleteOneTagRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: deleteOneTagRouteDefinition.schemas.body,
    })

    try {
        await deleteOne({
            database: c.var.clients.sql,
            table: models.tag,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idTag)),
        })
    } catch {
        throw new Exception({
            statusCode: 400,
            internalMessage: "Tag not found",
            externalMessage: "Catégorie introuvable",
        })
    }

    return response({
        context: c,
        statusCode: 200,
        schema: deleteOneTagRouteDefinition.schemas.return,
        data: {},
    })
})
