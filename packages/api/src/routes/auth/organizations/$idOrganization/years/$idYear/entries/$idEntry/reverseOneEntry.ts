import { generateId, models, reverseOneEntryRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { registerRoute } from "../../../../../../../../utilities/registerRoute.js"
import { response } from "../../../../../../../../utilities/response.js"
import { insertMany } from "../../../../../../../../utilities/sql/insertMany.js"
import { insertOne } from "../../../../../../../../utilities/sql/insertOne.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"
import { selectOne } from "../../../../../../../../utilities/sql/selectOne.js"

export const reverseOneEntryRoute = registerRoute(reverseOneEntryRouteDefinition, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: reverseOneEntryRouteDefinition.schemas.body,
    })

    const reversedEntry = await c.var.clients.sql.transaction(async (tx) => {
        const originalEntry = await selectOne({
            database: tx,
            table: models.entry,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.id, body.idEntry),
                ),
        })

        const originalEntryLines = await selectMany({
            database: tx,
            table: models.entryLine,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.idEntry, originalEntry.id),
                ),
        })

        const reverseEntry = await insertOne({
            database: tx,
            table: models.entry,
            data: {
                id: generateId(),
                idOrganization: originalEntry.idOrganization,
                idYear: originalEntry.idYear,
                idJournal: originalEntry.idJournal,
                idFile: originalEntry.idFile,
                label: `${originalEntry.label} (extourne)`,
                date: originalEntry.date,
                createdAt: new Date().toISOString(),
                lastUpdatedAt: null,
                createdBy: auth.user.id,
                lastUpdatedBy: null,
            },
        })

        await insertMany({
            database: tx,
            table: models.entryLine,
            data: originalEntryLines.map((entryLine) => ({
                id: generateId(),
                idOrganization: originalEntry.idOrganization,
                idYear: originalEntry.idYear,
                idEntry: reverseEntry.id,
                idAccount: entryLine.idAccount,
                isComputedForJournalReport: entryLine.isComputedForJournalReport,
                isComputedForLedgerReport: entryLine.isComputedForLedgerReport,
                isComputedForBalanceReport: entryLine.isComputedForBalanceReport,
                isComputedForBalanceSheetReport: entryLine.isComputedForBalanceSheetReport,
                isComputedForIncomeStatementReport: entryLine.isComputedForIncomeStatementReport,
                debit: entryLine.credit,
                credit: entryLine.debit,
                createdAt: new Date().toISOString(),
                lastUpdatedAt: null,
                createdBy: auth.user.id,
                lastUpdatedBy: null,
            })),
        })

        const originalEntryTags = await selectMany({
            database: tx,
            table: models.entryTag,
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.idEntry, originalEntry.id),
                ),
        })

        if (originalEntryTags.length > 0) {
            await insertMany({
                database: tx,
                table: models.entryTag,
                data: originalEntryTags.map((entryTag) => ({
                    id: generateId(),
                    idOrganization: originalEntry.idOrganization,
                    idYear: originalEntry.idYear,
                    idEntry: reverseEntry.id,
                    idTag: entryTag.idTag,
                    createdAt: new Date().toISOString(),
                })),
            })
        }

        return reverseEntry
    })

    return response({
        context: c,
        statusCode: 200,
        schema: reverseOneEntryRouteDefinition.schemas.return,
        data: reversedEntry,
    })
})
