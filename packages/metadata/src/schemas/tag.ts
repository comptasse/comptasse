import * as v from "valibot"
import { dateTimeSchema } from "../components/index.js"
import { idSchema } from "../components/schemas/idSchema.js"
import { varcharSchema } from "../components/schemas/varcharSchema.js"
import type { tagModel } from "../models/tag.js"

export const tagSchema = v.object({
    id: v.nonNullable(idSchema, "Ce champ est requis"),
    idOrganization: v.nonNullable(idSchema, "Ce champ est requis"),

    label: v.nonNullable(
        varcharSchema({
            maxLength: 256,
        }),
        "Ce champ est requis",
    ),

    createdAt: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
    lastUpdatedAt: v.nullable(dateTimeSchema),
    createdBy: v.nullable(idSchema),
    lastUpdatedBy: v.nullable(idSchema),
}) satisfies v.GenericSchema<typeof tagModel.$inferSelect>

export const tagSchemaReturn = v.pick(tagSchema, [
    "id",
    "idOrganization",

    "label",

    "createdAt",
    "lastUpdatedAt",
    "createdBy",
    "lastUpdatedBy",
])

/** A tag with the ids of the years it is linked to (via `table_tag_year`). */
export const tagSchemaReturnWithYears = v.object({
    ...tagSchemaReturn.entries,
    idYearIds: v.array(idSchema),
})
