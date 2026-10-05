import * as v from "valibot"
import { dateTimeSchema, integerSchema, stringSchema } from "../components/index.js"
import { idSchema } from "../components/schemas/idSchema.js"
import { varcharSchema } from "../components/schemas/varcharSchema.js"
import type { fileModel } from "../models/file.js"

export const fileSchema = v.object({
    id: v.nonNullable(idSchema, "Ce champ est requis"),
    idOrganization: v.nonNullable(idSchema, "Ce champ est requis"),
    idFolder: v.nullable(idSchema),
    idFileParent: v.nullable(idSchema),
    reference: v.nullable(
        varcharSchema({
            maxLength: 256,
        }),
    ),
    name: v.nonNullable(
        varcharSchema({
            maxLength: 256,
        }),
        "Ce champ est requis",
    ),
    storageKey: v.nullable(stringSchema),
    type: v.nullable(stringSchema),
    size: v.nullable(integerSchema),
    hash: v.nullable(stringSchema),
    date: v.nullable(dateTimeSchema),
    createdAt: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
    lastUpdatedAt: v.nullable(dateTimeSchema),
    createdBy: v.nullable(idSchema),
    lastUpdatedBy: v.nullable(idSchema),
}) satisfies v.GenericSchema<typeof fileModel.$inferSelect>

export const fileSchemaReturn = v.pick(fileSchema, [
    "id",
    "idOrganization",
    "idFolder",
    "idFileParent",
    "reference",
    "name",
    "storageKey",
    "type",
    "size",
    "createdAt",
    "lastUpdatedAt",
    "hash",
    "date",
    "createdBy",
    "lastUpdatedBy",
])
