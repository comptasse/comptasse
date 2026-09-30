import { deleteOneMatchingRouteDefinition, models } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { deleteOne } from "../../../../../../../../utilities/sql/deleteOne.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../../../utilities/sql/updateOne.js"

export const deleteOneMatchingRoute = registerRoute(deleteOneMatchingRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: deleteOneMatchingRouteDefinition.schemas.body,
    })

    await c.var.clients.sql.transaction(async (tx) => {
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

        // Unlink the matched entry lines before deleting the matching.
        const entryLines = await selectMany({
            database: tx,
            table: models.entryLine,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.idMatching, body.idMatching),
                ),
        })
        for (const entryLine of entryLines) {
            await updateOne({
                database: tx,
                table: models.entryLine,
                data: {
                    idMatching: null,
                    lastUpdatedAt: new Date().toISOString(),
                    lastUpdatedBy: auth.user.id,
                },
                where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, entryLine.id)),
            })
        }

        await deleteOne({
            database: tx,
            table: models.matching,
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
        schema: deleteOneMatchingRouteDefinition.schemas.return,
        data: {},
    })
})
