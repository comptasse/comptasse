import { accountSchema, accountSchemaReturn } from "./account.js"
import { balanceSheetSchema, balanceSheetSchemaReturn } from "./balanceSheet.js"
import { computationSchema, computationSchemaReturn } from "./computation.js"
import {
    computationIncomeStatementSchema,
    computationIncomeStatementSchemaReturn,
} from "./computationIncomeStatement.js"
import { entrySchema, entrySchemaReturn } from "./entry.js"
import { entryLineSchema, entryLineSchemaReturn } from "./entryLine.js"
import { entryTagSchema, entryTagSchemaReturn } from "./entryTag.js"
import { fileSchema, fileSchemaReturn } from "./file.js"
import { folderSchema, folderSchemaReturn } from "./folder.js"
import { incomeStatementSchema, incomeStatementSchemaReturn } from "./incomeStatement.js"
import { inventoryItemSchema, inventoryItemSchemaReturn } from "./inventoryItem.js"
import { inventoryMovementSchema, inventoryMovementSchemaReturn } from "./inventoryMovement.js"
import { journalSchema, journalSchemaReturn } from "./journal.js"
import { matchingSchema, matchingSchemaReturn } from "./matching.js"
import { organizationSchema, organizationSchemaReturn } from "./organization.js"
import { organizationUserSchema, organizationUserSchemaReturn } from "./organizationUser.js"
import { tagSchema, tagSchemaReturn } from "./tag.js"
import { userSchema, userSchemaReturn } from "./user.js"
import { userSessionSchema, userSessionSchemaReturn } from "./userSession.js"
import { yearSchema, yearSchemaReturn } from "./year.js"

export const schemas = {
    account: accountSchema,
    entry: entrySchema,
    entryLine: entryLineSchema,
    entryTag: entryTagSchema,
    file: fileSchema,
    folder: folderSchema,
    balanceSheet: balanceSheetSchema,
    computation: computationSchema,
    computationIncomeStatement: computationIncomeStatementSchema,
    incomeStatement: incomeStatementSchema,
    inventoryItem: inventoryItemSchema,
    inventoryMovement: inventoryMovementSchema,
    journal: journalSchema,
    matching: matchingSchema,
    organization: organizationSchema,
    organizationUser: organizationUserSchema,
    tag: tagSchema,
    user: userSchema,
    userSession: userSessionSchema,
    year: yearSchema,
}

export const returnedSchemas = {
    account: accountSchemaReturn,
    entry: entrySchemaReturn,
    entryLine: entryLineSchemaReturn,
    entryTag: entryTagSchemaReturn,
    file: fileSchemaReturn,
    folder: folderSchemaReturn,
    balanceSheet: balanceSheetSchemaReturn,
    computation: computationSchemaReturn,
    computationIncomeStatement: computationIncomeStatementSchemaReturn,
    incomeStatement: incomeStatementSchemaReturn,
    inventoryItem: inventoryItemSchemaReturn,
    inventoryMovement: inventoryMovementSchemaReturn,
    journal: journalSchemaReturn,
    matching: matchingSchemaReturn,
    organization: organizationSchemaReturn,
    organizationUser: organizationUserSchemaReturn,
    tag: tagSchemaReturn,
    user: userSchemaReturn,
    userSession: userSessionSchemaReturn,
    year: yearSchemaReturn,
}
