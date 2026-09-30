import * as v from "valibot"
import { routePath } from "../../../../../../../../../../../components/index.js"
import { entryLineSchema, entryLineSchemaReturn } from "../../../../../../../../../../../schemas/entryLine.js"
import { routeDefinition } from "../../../../../../../../../../../utilities/routeDefinition.js"

export const updateOneEntryLineRouteDefinition = routeDefinition({
    protocol: "http",
    method: "PATCH",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries/:idEntry/lines/:idEntryLine`,
    name: "update-one-entry-line",
    schemas: {
        body: v.object({
            idEntryLine: entryLineSchema.entries.id,
            idYear: entryLineSchema.entries.idYear,
            idEntry: v.optional(entryLineSchema.entries.idEntry),
            idAccount: v.optional(entryLineSchema.entries.idAccount),
            isComputedForJournalReport: v.optional(entryLineSchema.entries.isComputedForJournalReport),
            isComputedForLedgerReport: v.optional(entryLineSchema.entries.isComputedForLedgerReport),
            isComputedForBalanceReport: v.optional(entryLineSchema.entries.isComputedForBalanceReport),
            isComputedForBalanceSheetReport: v.optional(entryLineSchema.entries.isComputedForBalanceSheetReport),
            isComputedForIncomeStatementReport: v.optional(entryLineSchema.entries.isComputedForIncomeStatementReport),
            debit: v.optional(entryLineSchema.entries.debit),
            credit: v.optional(entryLineSchema.entries.credit),
        }),
        return: entryLineSchemaReturn,
    },
})
