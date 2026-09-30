import { createOneEntryLineRouteDefinition, generateId, models } from "@comptasse/application-metadata"
import { checkAuthMiddleware } from "../../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../../middlewares/validateBody.middleware.js"
import { apiFactory } from "../../../../../../../../../utilities/apiFactory.js"
import { response } from "../../../../../../../../../utilities/response.js"
import { insertOne } from "../../../../../../../../../utilities/sql/insertOne.js"

export const createOneEntryLineRoute = apiFactory
    .createApp()
    .post(createOneEntryLineRouteDefinition.path, async (c) => {
        const auth = await checkAuthMiddleware({
            context: c,
        })
        const idOrganization = await requireOrganizationMiddleware({
            idOrganization: auth.idOrganization,
        })
        const body = await validateBodyMiddleware({
            context: c,
            schema: createOneEntryLineRouteDefinition.schemas.body,
        })

        const createOneEntryLine = await insertOne({
            database: c.var.clients.sql,
            table: models.entryLine,
            data: {
                id: generateId(),
                idOrganization: idOrganization,
                idYear: body.idYear,
                idEntry: body.idEntry,
                idAccount: body.idAccount,
                isComputedForJournalReport: body.isComputedForJournalReport,
                isComputedForLedgerReport: body.isComputedForLedgerReport,
                isComputedForBalanceReport: body.isComputedForBalanceReport,
                isComputedForBalanceSheetReport: body.isComputedForBalanceSheetReport,
                isComputedForIncomeStatementReport: body.isComputedForIncomeStatementReport,
                debit: body.debit ?? "0.00",
                credit: body.credit ?? "0.00",
                createdAt: new Date().toISOString(),
                lastUpdatedAt: null,
                createdBy: auth.user.id,
                lastUpdatedBy: null,
            },
        })

        return response({
            context: c,
            statusCode: 200,
            schema: createOneEntryLineRouteDefinition.schemas.return,
            data: createOneEntryLine,
        })
    })
