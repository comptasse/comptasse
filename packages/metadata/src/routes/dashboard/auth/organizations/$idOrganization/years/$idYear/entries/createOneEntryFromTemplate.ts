import * as v from "valibot"
import { routePath } from "../../../../../../../../components/index.js"
import { entrySchema, entrySchemaReturn } from "../../../../../../../../schemas/entry.js"
import { entryLineSchema } from "../../../../../../../../schemas/entryLine.js"
import { routeDefinition } from "../../../../../../../../utilities/routeDefinition.js"

export const createOneEntryFromTemplateRouteDefinition = routeDefinition({
    protocol: "http",
    method: "POST",
    path: `${routePath.v1}/organizations/:idOrganization/years/:idYear/entries/from-template`,
    name: "create-one-entry-from-template",
    schemas: {
        body: v.object({
            idYear: entrySchema.entries.idYear,
            idJournal: v.optional(entrySchema.entries.idJournal),
            idFile: v.optional(entrySchema.entries.idFile),
            label: entrySchema.entries.label,
            date: entrySchema.entries.date,
            entryLines: v.array(
                v.object({
                    idAccount: entryLineSchema.entries.idAccount,
                    isComputedForJournalReport: entryLineSchema.entries.isComputedForJournalReport,
                    isComputedForLedgerReport: entryLineSchema.entries.isComputedForLedgerReport,
                    isComputedForBalanceReport: entryLineSchema.entries.isComputedForBalanceReport,
                    isComputedForBalanceSheetReport: entryLineSchema.entries.isComputedForBalanceSheetReport,
                    isComputedForIncomeStatementReport: entryLineSchema.entries.isComputedForIncomeStatementReport,
                    debit: v.optional(entryLineSchema.entries.debit),
                    credit: v.optional(entryLineSchema.entries.credit),
                }),
            ),
        }),
        return: entrySchemaReturn,
    },
})
