import { connectEntryLinesToMatchingRouteDefinition, models } from "@comptasse/application-metadata"
import { and, eq, inArray } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../../../utilities/exception.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../../../utilities/sql/updateOne.js"

export const connectEntryLinesToMatchingRoute = registerRoute(connectEntryLinesToMatchingRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: connectEntryLinesToMatchingRouteDefinition.schemas.body,
    })

    const updatedEntryLines = await c.var.clients.sql.transaction(async (tx) => {
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
        const matching = matchings.at(0)
        if (matching === undefined) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Matching not found",
                externalMessage: "Lettrage introuvable",
            })
        }

        const entryLines = await selectMany({
            database: tx,
            table: models.entryLine,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    inArray(table.id, body.entryLineIds),
                ),
        })

        if (entryLines.length !== body.entryLineIds.length) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Some entry lines were not found",
                externalMessage: "Certains mouvements sont introuvables",
            })
        }
        if (entryLines.some((entryLine) => entryLine.idAccount !== matching.idAccount)) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Entry lines do not belong to the matching account",
                externalMessage: "Tous les mouvements doivent être sur le même compte que le lettrage",
            })
        }
        if (entryLines.some((entryLine) => entryLine.idMatching !== null)) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Entry line is already matched",
                externalMessage: "Un mouvement est déjà lettré",
            })
        }

        const result = []
        for (const entryLine of entryLines) {
            const updatedEntryLine = await updateOne({
                database: tx,
                table: models.entryLine,
                data: {
                    idMatching: matching.id,
                    lastUpdatedAt: new Date().toISOString(),
                    lastUpdatedBy: auth.user.id,
                },
                where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, entryLine.id)),
            })
            result.push(updatedEntryLine)
        }

        return result
    })

    return response({
        context: c,
        statusCode: 200,
        schema: connectEntryLinesToMatchingRouteDefinition.schemas.return,
        data: updatedEntryLines,
    })
})
