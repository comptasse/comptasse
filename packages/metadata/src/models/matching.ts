import { type AnyPgColumn, index, pgTable, unique, varchar } from "drizzle-orm/pg-core"
import { dateTimeColumn } from "../components/models/dateTimeColumn.js"
import { idColumn } from "../components/models/idColumn.js"
import { accountModel } from "./account.js"
import { organizationModel } from "./organization.js"
import { userModel } from "./user.js"
import { yearModel } from "./year.js"

// Model
export const matchingModel = pgTable(
    "table_matching",
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
        idAccount: idColumn("id_account")
            .references(() => accountModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),

        code: varchar("code", {
            length: 256,
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
        unique().on(t.idOrganization, t.idYear, t.code),
        index().on(t.idOrganization, t.idYear),
        index().on(t.idAccount),
    ],
)
