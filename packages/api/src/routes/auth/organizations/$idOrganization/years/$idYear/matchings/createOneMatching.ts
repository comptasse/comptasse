import { createOneMatchingRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { and, eq, inArray } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../middlewares/validateBody.middleware.js"
import { Exception } from "../../../../../../../utilities/exception.js"
import { toMatchingCode } from "../../../../../../../utilities/matchingCode.js"
import { registerRoute } from "../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../utilities/response.js"
import { insertOne } from "../../../../../../../utilities/sql/insertOne.js"
import { selectMany } from "../../../../../../../utilities/sql/selectMany.js"
import { updateOne } from "../../../../../../../utilities/sql/updateOne.js"

export const createOneMatchingRoute = registerRoute(createOneMatchingRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: createOneMatchingRouteDefinition.schemas.body,
    })

    const matching = await c.var.clients.sql.transaction(async (tx) => {
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
        if (entryLines.some((entryLine) => entryLine.idAccount !== body.idAccount)) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Entry lines do not belong to the matching account",
                externalMessage: "Tous les mouvements doivent être sur le même compte",
            })
        }
        if (entryLines.some((entryLine) => entryLine.idMatching !== null)) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Entry line is already matched",
                externalMessage: "Un mouvement est déjà lettré",
            })
        }

        const existingMatchings = await selectMany({
            database: tx,
            table: models.matching,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.idYear, body.idYear)),
        })
        const usedCodes = new Set(existingMatchings.map((matching) => matching.code))

        let code = body.code?.trim() ?? ""
        if (code === "") {
            // Auto-generate the next free letter code (A, B, ..., Z, AA, ...).
            for (let i = 1; ; i++) {
                const candidate = toMatchingCode(i)
                if (!usedCodes.has(candidate)) {
                    code = candidate
                    break
                }
            }
        } else if (usedCodes.has(code)) {
            throw new Exception({
                statusCode: 400,
                internalMessage: "Matching code already used",
                externalMessage: "Ce code de lettrage est déjà utilisé",
            })
        }

        const createdMatching = await insertOne({
            database: tx,
            table: models.matching,
            data: {
                id: generateId(),
                idOrganization: idOrganization,
                idYear: body.idYear,
                idAccount: body.idAccount,
                code: code,
                createdAt: new Date().toISOString(),
                lastUpdatedAt: null,
                createdBy: auth.user.id,
                lastUpdatedBy: null,
            },
        })

        for (const entryLine of entryLines) {
            await updateOne({
                database: tx,
                table: models.entryLine,
                data: {
                    idMatching: createdMatching.id,
                    lastUpdatedAt: new Date().toISOString(),
                    lastUpdatedBy: auth.user.id,
                },
                where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, entryLine.id)),
            })
        }

        return createdMatching
    })

    return response({
        context: c,
        statusCode: 200,
        schema: createOneMatchingRouteDefinition.schemas.return,
        data: matching,
    })
})
