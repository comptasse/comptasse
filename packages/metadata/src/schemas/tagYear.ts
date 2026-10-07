import * as v from "valibot"
import { dateTimeSchema } from "../components/index.js"
import { idSchema } from "../components/schemas/idSchema.js"
import type { tagYearModel } from "../models/tagYear.js"

export const tagYearSchema = v.object({
    id: v.nonNullable(idSchema, "Ce champ est requis"),
    idOrganization: v.nonNullable(idSchema, "Ce champ est requis"),
    idYear: v.nonNullable(idSchema, "Ce champ est requis"),
    idTag: v.nonNullable(idSchema, "Ce champ est requis"),

    createdAt: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
}) satisfies v.GenericSchema<typeof tagYearModel.$inferSelect>

export const tagYearSchemaReturn = v.pick(tagYearSchema, [
    "id",
    "idOrganization",
    "idYear",
    "idTag",
    "createdAt",
])
