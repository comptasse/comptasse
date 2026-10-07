import { models, updateOneMatchingRouteDefinition } from "@comptasse/application-metadata"
import { and, eq, ne } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../../../utilities/sql/updateOne.js"

export const updateOneMatchingRoute = registerRoute(updateOneMatchingRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: updateOneMatchingRouteDefinition.schemas.body,
    })

    const updatedMatching = await c.var.clients.sql.transaction(async (tx) => {
        const matchings = await selectMany({
            database: tx,
            table: models.matching,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.id, body.idMatching),
                ),
        })
        if (matchings.length === 0) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Matching not found",
                externalMessage: "Lettrage introuvable",
            })
        }

        const code = body.code.trim()
        if (code === "") {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Matching code is required",
                externalMessage: "Un code de lettrage est requis",
            })
        }

        const conflictingMatchings = await selectMany({
            database: tx,
            table: models.matching,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.code, code),
                    ne(table.id, body.idMatching),
                ),
        })
        if (conflictingMatchings.length > 0) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Matching code already used",
                externalMessage: "Ce code de lettrage est déjà utilisé",
            })
        }

        return updateOne({
            database: tx,
            table: models.matching,
            data: {
                code: code,
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: auth.user.id,
            },
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.id, body.idMatching),
                ),
        })
    })

    return response({
        context: c,
        statusCode: 200,
        schema: updateOneMatchingRouteDefinition.schemas.return,
        data: updatedMatching,
    })
})
