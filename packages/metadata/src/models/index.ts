import * as accountModel from "./account.js"
import * as balanceSheetModel from "./balanceSheet.js"
import * as computationModel from "./computation.js"
import * as computationIncomeStatementModel from "./computationIncomeStatement.js"
import * as entryModel from "./entry.js"
import * as entryLineModel from "./entryLine.js"
import * as entryTagModel from "./entryTag.js"
import * as fileModel from "./file.js"
import * as folderModel from "./folder.js"
import * as incomeStatementModel from "./incomeStatement.js"
import * as inventoryItemModel from "./inventoryItem.js"
import * as inventoryMovementModel from "./inventoryMovement.js"
import * as journalModel from "./journal.js"
import * as matchingModel from "./matching.js"
import * as organizationModel from "./organization.js"
import * as organizationUserModel from "./organizationUser.js"
import * as tagModel from "./tag.js"
import * as tagYearModel from "./tagYear.js"
import * as userModel from "./user.js"
import * as userSessionModel from "./userSession.js"
import * as yearModel from "./year.js"

export const models = {
    account: accountModel.accountModel,
    file: fileModel.fileModel,
    folder: folderModel.folderModel,
    balanceSheet: balanceSheetModel.balanceSheetModel,
    computation: computationModel.computationModel,
    computationIncomeStatement: computationIncomeStatementModel.computationIncomeStatementModel,
    entry: entryModel.entryModel,
    entryLine: entryLineModel.entryLineModel,
    entryTag: entryTagModel.entryTagModel,
    incomeStatement: incomeStatementModel.incomeStatementModel,
    inventoryItem: inventoryItemModel.inventoryItemModel,
    inventoryMovement: inventoryMovementModel.inventoryMovementModel,
    journal: journalModel.journalModel,
    matching: matchingModel.matchingModel,
    organization: organizationModel.organizationModel,
    organizationUser: organizationUserModel.organizationUserModel,
    tag: tagModel.tagModel,
    tagYear: tagYearModel.tagYearModel,
    user: userModel.userModel,
    userSession: userSessionModel.userSessionModel,
    year: yearModel.yearModel,
}

export const modelSchemas = {
    ...accountModel,
    ...fileModel,
    ...folderModel,
    ...balanceSheetModel,
    ...computationModel,
    ...computationIncomeStatementModel,
    ...entryModel,
    ...entryLineModel,
    ...entryTagModel,
    ...incomeStatementModel,
    ...inventoryItemModel,
    ...inventoryMovementModel,
    ...journalModel,
    ...matchingModel,
    ...organizationModel,
    ...organizationUserModel,
    ...tagModel,
    ...tagYearModel,
    ...userModel,
    ...userSessionModel,
    ...yearModel,
}
