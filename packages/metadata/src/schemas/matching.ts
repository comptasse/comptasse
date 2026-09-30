import * as v from "valibot"
import { dateTimeSchema } from "../components/index.js"
import { idSchema } from "../components/schemas/idSchema.js"
import { varcharSchema } from "../components/schemas/varcharSchema.js"
import type { matchingModel } from "../models/matching.js"

export const matchingSchema = v.object({
    id: v.nonNullable(idSchema, "Ce champ est requis"),
    idOrganization: v.nonNullable(idSchema, "Ce champ est requis"),
    idYear: v.nonNullable(idSchema, "Ce champ est requis"),
    idAccount: v.nonNullable(idSchema, "Ce champ est requis"),

    code: v.nonNullable(
        varcharSchema({
            maxLength: 256,
        }),
        "Ce champ est requis",
    ),

    createdAt: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
    lastUpdatedAt: v.nullable(dateTimeSchema),
    createdBy: v.nullable(idSchema),
    lastUpdatedBy: v.nullable(idSchema),
}) satisfies v.GenericSchema<typeof matchingModel.$inferSelect>

export const matchingSchemaReturn = v.pick(matchingSchema, [
    "id",
    "idOrganization",
    "idYear",
    "idAccount",

    "code",

    "createdAt",
    "lastUpdatedAt",
    "createdBy",
    "lastUpdatedBy",
])
