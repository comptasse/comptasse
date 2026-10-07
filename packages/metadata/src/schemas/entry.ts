import * as v from "valibot"
import { booleanSchema, dateTimeSchema } from "../components/index.js"
import { idSchema } from "../components/schemas/idSchema.js"
import { varcharSchema } from "../components/schemas/varcharSchema.js"
import type { entryModel } from "../models/entry.js"

export const entrySchema = v.object({
    id: v.nonNullable(idSchema, "Ce champ est requis"),
    idOrganization: v.nonNullable(idSchema, "Ce champ est requis"),
    idYear: v.nonNullable(idSchema, "Ce champ est requis"),
    idJournal: v.nullable(idSchema),
    idFile: v.nullable(idSchema),
    idempotencyKey: v.nullable(
        varcharSchema({
            maxLength: 256,
        }),
    ),
    label: v.nonNullable(
        varcharSchema({
            maxLength: 256,
        }),
        "Ce champ est requis",
    ),
    description: v.nullable(
        varcharSchema({
            maxLength: 2048,
        }),
    ),
    isCleared: v.nonNullable(booleanSchema, "Ce champ est requis"),
    date: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
    createdAt: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
    lastUpdatedAt: v.nullable(dateTimeSchema),
    createdBy: v.nullable(idSchema),
    lastUpdatedBy: v.nullable(idSchema),
}) satisfies v.GenericSchema<typeof entryModel.$inferSelect>

export const entrySchemaReturn = v.pick(entrySchema, [
    "id",
    "idOrganization",
    "idYear",
    "idJournal",
    "idFile",
    "idempotencyKey",
    "label",
    "description",
    "isCleared",
    "date",
    "createdAt",
    "lastUpdatedAt",
    "createdBy",
    "lastUpdatedBy",
])
