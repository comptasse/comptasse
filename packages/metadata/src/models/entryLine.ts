import { relations } from "drizzle-orm"
import { type AnyPgColumn, boolean, index, numeric, pgTable } from "drizzle-orm/pg-core"
import { dateTimeColumn } from "../components/models/dateTimeColumn.js"
import { idColumn } from "../components/models/idColumn.js"
import { accountModel } from "./account.js"
import { entryModel } from "./entry.js"
import { organizationModel } from "./organization.js"
import { userModel } from "./user.js"
import { yearModel } from "./year.js"

// Model
export const entryLineModel = pgTable(
    "table_entry_line",
    {
        id: idColumn("id").primaryKey(),
        idOrganization: idColumn("id_organization")
            .references(() => organizationModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),
        idYear: idColumn("id_year")
            .references(() => yearModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),
        idEntry: idColumn("id_entry")
            .references(() => entryModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),
        idAccount: idColumn("id_account")
            .references(() => accountModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),
        isComputedForJournalReport: boolean("is_computed_for_journal_report").notNull(),
        isComputedForLedgerReport: boolean("is_computed_for_ledger_report").notNull(),
        isComputedForBalanceReport: boolean("is_computed_for_balance_report").notNull(),
        isComputedForBalanceSheetReport: boolean("is_computed_for_balance_sheet_report").notNull(),
        isComputedForIncomeStatementReport: boolean("is_computed_for_income_statement_report").notNull(),
        debit: numeric("debit", {
            scale: 2,
        }).notNull(),
        credit: numeric("credit", {
            scale: 2,
        }).notNull(),
        createdAt: dateTimeColumn("created_at").notNull(),
        lastUpdatedAt: dateTimeColumn("last_updated_at"),
        createdBy: idColumn("created_by").references((): AnyPgColumn => userModel.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        lastUpdatedBy: idColumn("last_updated_by").references((): AnyPgColumn => userModel.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
    },
    (t) => [
        index().on(t.idOrganization, t.idYear),
        index().on(t.idEntry),
    ],
)

// Relations
export const entryLineRelations = relations(entryLineModel, ({ one }) => ({
    entry: one(entryModel, {
        fields: [
            entryLineModel.idEntry,
        ],
        references: [
            entryModel.id,
        ],
    }),
    account: one(accountModel, {
        fields: [
            entryLineModel.idAccount,
        ],
        references: [
            accountModel.id,
        ],
    }),
}))
