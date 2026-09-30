import { models, updateOneEntryLineRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../../../middlewares/validateBody.middleware.js"
import { apiFactory } from "../../../../../../../../../../utilities/apiFactory.js"
import { response } from "../../../../../../../../../../utilities/response.js"
import { updateOne } from "../../../../../../../../../../utilities/sql/updateOne.js"

export const updateOneEntryLineRoute = apiFactory
    .createApp()
    .patch(updateOneEntryLineRouteDefinition.path, async (c) => {
        const auth = await checkAuthMiddleware({
            context: c,
        })
        const idOrganization = await requireOrganizationMiddleware({
            idOrganization: auth.idOrganization,
        })
        const body = await validateBodyMiddleware({
            context: c,
            schema: updateOneEntryLineRouteDefinition.schemas.body,
        })

        const updatedEntryLine = await updateOne({
            database: c.var.clients.sql,
            table: models.entryLine,
            data: {
                idEntry: body.idEntry,
                idAccount: body.idAccount,
                isComputedForJournalReport: body.isComputedForJournalReport,
                isComputedForLedgerReport: body.isComputedForLedgerReport,
                isComputedForBalanceReport: body.isComputedForBalanceReport,
                isComputedForBalanceSheetReport: body.isComputedForBalanceSheetReport,
                isComputedForIncomeStatementReport: body.isComputedForIncomeStatementReport,
                debit: body.debit,
                credit: body.credit,
                lastUpdatedAt: new Date().toISOString(),
                lastUpdatedBy: auth.user.id,
            },
            where: (table) =>
                and(
                    eq(table.idOrganization, idOrganization),
                    eq(table.idYear, body.idYear),
                    eq(table.id, body.idEntryLine),
                ),
        })

        return response({
            context: c,
            statusCode: 200,
            schema: updateOneEntryLineRouteDefinition.schemas.return,
            data: updatedEntryLine,
        })
    })
