import { relations } from "drizzle-orm"
import { index, pgTable, unique } from "drizzle-orm/pg-core"
import { dateTimeColumn } from "../components/models/dateTimeColumn.js"
import { idColumn } from "../components/models/idColumn.js"
import { organizationModel } from "./organization.js"
import { tagModel } from "./tag.js"
import { yearModel } from "./year.js"

// Model
export const tagYearModel = pgTable(
    "table_tag_year",
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
        idTag: idColumn("id_tag")
            .references(() => tagModel.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            })
            .notNull(),
        createdAt: dateTimeColumn("created_at").notNull(),
    },
    (t) => [
        unique().on(t.idYear, t.idTag),
        index().on(t.idOrganization, t.idYear),
        index().on(t.idTag),
    ],
)

// Relations
export const tagYearRelations = relations(tagYearModel, ({ one }) => ({
    tag: one(tagModel, {
        fields: [
            tagYearModel.idTag,
        ],
        references: [
            tagModel.id,
        ],
    }),
    year: one(yearModel, {
        fields: [
            tagYearModel.idYear,
        ],
        references: [
            yearModel.id,
        ],
    }),
}))
