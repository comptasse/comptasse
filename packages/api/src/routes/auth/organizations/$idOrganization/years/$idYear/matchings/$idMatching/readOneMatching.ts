import { models, readOneMatchingRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"

export const readOneMatchingRoute = registerRoute(readOneMatchingRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: readOneMatchingRouteDefinition.schemas.body,
    })

    const matchings = await selectMany({
        database: c.var.clients.sql,
        table: models.matching,
        where: (table) =>
            and(eq(table.idOrganization, idOrganization), eq(table.idYear, body.idYear), eq(table.id, body.idMatching)),
    })
    const matching = matchings.at(0)
    if (matching === undefined) {
        throw new Exception({
            statusCode: 400,
            internalMessage: "Matching not found",
            externalMessage: "Lettrage introuvable",
        })
    }

    return response({
        context: c,
        statusCode: 200,
        schema: readOneMatchingRouteDefinition.schemas.return,
        data: matching,
    })
})
