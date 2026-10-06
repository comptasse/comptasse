import { sql } from "drizzle-orm"
import { type AnyPgColumn, integer, pgTable, text, uniqueIndex, varchar } from "drizzle-orm/pg-core"
import { dateTimeColumn } from "../components/models/dateTimeColumn.js"
import { idColumn } from "../components/models/idColumn.js"
import { folderModel } from "./folder.js"
import { organizationModel } from "./organization.js"
import { userModel } from "./user.js"

// Model
export const fileModel = pgTable(
    "table_file",
    {
        id: idColumn("id").primaryKey(),
        idOrganization: idColumn("id_organization")
            .references(() => organizationModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),
        idFolder: idColumn("id_folder").references(() => folderModel.id, {
            onDelete: "set null",
            onUpdate: "cascade",
        }),
        idFileParent: idColumn("id_file_parent").references((): AnyPgColumn => fileModel.id, {
            onDelete: "cascade",
            onUpdate: "cascade",
        }),
        reference: varchar("reference", {
            length: 256,
        }),
        name: varchar("name", {
            length: 256,
        }).notNull(),
        description: varchar("description", {
            length: 2048,
        }),
        storageKey: text("storage_key"),
        type: text("type"),
        size: integer("size"),
        hash: text("hash"),
        date: dateTimeColumn("date"),
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
    (table) => [
        uniqueIndex("table_file_id_organization_hash_unique")
            .on(table.idOrganization, table.hash)
            .where(sql`${table.hash} IS NOT NULL`),
    ],
)
