import * as v from "valibot"
import { routePath } from "../../../../../../../../../../components/index.js"
import { entryLineSchema, entryLineSchemaReturn } from "../../../../../../../../../../schemas/entryLine.js"
import { routeDefinition } from "../../../../../../../../../../utilities/routeDefinition.js"

export const createOneEntryLineRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries/:idEntry/lines`,
    name: "create-one-entry-line",
    schemas: {
        body: v.object({
            idYear: entryLineSchema.entries.idYear,
            idEntry: entryLineSchema.entries.idEntry,
            idAccount: entryLineSchema.entries.idAccount,
            isComputedForJournalReport: entryLineSchema.entries.isComputedForJournalReport,
            isComputedForLedgerReport: entryLineSchema.entries.isComputedForLedgerReport,
            isComputedForBalanceReport: entryLineSchema.entries.isComputedForBalanceReport,
            isComputedForBalanceSheetReport: entryLineSchema.entries.isComputedForBalanceSheetReport,
            isComputedForIncomeStatementReport: entryLineSchema.entries.isComputedForIncomeStatementReport,
            debit: v.optional(entryLineSchema.entries.debit),
            credit: v.optional(entryLineSchema.entries.credit),
        }),
        return: entryLineSchemaReturn,
    },
})
