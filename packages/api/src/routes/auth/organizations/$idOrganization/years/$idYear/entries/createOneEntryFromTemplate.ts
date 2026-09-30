import { createOneEntryFromTemplateRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { checkAuthMiddleware } from "../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../middlewares/validateBody.middleware.js"
import { apiFactory } from "../../../../../../../utilities/apiFactory.js"
import { response } from "../../../../../../../utilities/response.js"
import { insertMany } from "../../../../../../../utilities/sql/insertMany.js"
import { insertOne } from "../../../../../../../utilities/sql/insertOne.js"

export const createOneEntryFromTemplateRoute = apiFactory
    .createApp()
    .post(createOneEntryFromTemplateRouteDefinition.path, async (c) => {
        const auth = await checkAuthMiddleware({
            context: c,
        })
        const idOrganization = await requireOrganizationMiddleware({
            idOrganization: auth.idOrganization,
        })
        const body = await validateBodyMiddleware({
            context: c,
            schema: createOneEntryFromTemplateRouteDefinition.schemas.body,
        })

        const createdEntry = await c.var.clients.sql.transaction(async (tx) => {
            const entry = await insertOne({
                database: tx,
                table: models.entry,
                data: {
                    id: generateId(),
                    idOrganization: idOrganization,
                    idYear: body.idYear,
                    idJournal: body.idJournal,
                    idFile: body.idFile,
                    label: body.label,
                    date: body.date,
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: null,
                    createdBy: auth.user.id,
                    lastUpdatedBy: null,
                },
            })

            if (body.entryLines.length > 0) {
                await insertMany({
                    database: tx,
                    table: models.entryLine,
                    data: body.entryLines.map((line) => ({
                        id: generateId(),
                        idOrganization: idOrganization,
                        idYear: body.idYear,
                        idEntry: entry.id,
                        idAccount: line.idAccount,
                        isComputedForJournalReport: line.isComputedForJournalReport,
                        isComputedForLedgerReport: line.isComputedForLedgerReport,
                        isComputedForBalanceReport: line.isComputedForBalanceReport,
                        isComputedForBalanceSheetReport: line.isComputedForBalanceSheetReport,
                        isComputedForIncomeStatementReport: line.isComputedForIncomeStatementReport,
                        debit: line.debit ?? "0.00",
                        credit: line.credit ?? "0.00",
                        createdAt: new Date().toISOString(),
                        lastUpdatedAt: null,
                        createdBy: auth.user.id,
                        lastUpdatedBy: null,
                    })),
                })
            }

            return entry
        })

        return response({
            context: c,
            statusCode: 200,
            schema: createOneEntryFromTemplateRouteDefinition.schemas.return,
            data: createdEntry,
        })
    })
