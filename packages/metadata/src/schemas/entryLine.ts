import * as v from "valibot"
import { booleanSchema, dateTimeSchema, numericSchema } from "../components/index.js"
import { idSchema } from "../components/schemas/idSchema.js"
import type { entryLineModel } from "../models/entryLine.js"

export const entryLineSchema = v.object({
    id: v.nonNullable(idSchema, "Ce champ est requis"),
    idOrganization: v.nonNullable(idSchema, "Ce champ est requis"),
    idYear: v.nonNullable(idSchema, "Ce champ est requis"),
    idEntry: v.nonNullable(idSchema, "Ce champ est requis"),
    idAccount: v.nonNullable(idSchema, "Ce champ est requis"),
    isComputedForJournalReport: v.nonNullable(booleanSchema, "Ce champ est requis"),
    isComputedForLedgerReport: v.nonNullable(booleanSchema, "Ce champ est requis"),
    isComputedForBalanceReport: v.nonNullable(booleanSchema, "Ce champ est requis"),
    isComputedForBalanceSheetReport: v.nonNullable(booleanSchema, "Ce champ est requis"),
    isComputedForIncomeStatementReport: v.nonNullable(booleanSchema, "Ce champ est requis"),
    debit: v.nonNullable(numericSchema, "Ce champ est requis"),
    credit: v.nonNullable(numericSchema, "Ce champ est requis"),
    createdAt: v.nonNullable(dateTimeSchema, "Ce champ est requis"),
    lastUpdatedAt: v.nullable(dateTimeSchema),
    createdBy: v.nullable(idSchema),
    lastUpdatedBy: v.nullable(idSchema),
}) satisfies v.GenericSchema<typeof entryLineModel.$inferSelect>

export const entryLineSchemaReturn = v.pick(entryLineSchema, [
    "id",
    "idOrganization",
    "idYear",
    "idEntry",
    "idAccount",
    "isComputedForJournalReport",
    "isComputedForLedgerReport",
    "isComputedForBalanceReport",
    "isComputedForBalanceSheetReport",
    "isComputedForIncomeStatementReport",
    "debit",
    "credit",
    "createdAt",
    "lastUpdatedAt",
    "createdBy",
    "lastUpdatedBy",
])
