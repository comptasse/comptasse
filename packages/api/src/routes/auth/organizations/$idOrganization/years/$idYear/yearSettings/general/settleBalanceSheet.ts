import { generateId, models, settleBalanceSheetRouteDefinition } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../../middlewares/validateBody.middleware.js"
import { apiFactory } from "../../../../../../../../utilities/apiFactory.js"
import { Exception } from "../../../../../../../../utilities/exception.js"
import { response } from "../../../../../../../../utilities/response.js"
import { selectBalancesByIdAccount } from "../../../../../../../../utilities/scenarios/accountBalances.js"
import { deleteMany } from "../../../../../../../../utilities/sql/deleteMany.js"
import { insertMany } from "../../../../../../../../utilities/sql/insertMany.js"
import { insertOne } from "../../../../../../../../utilities/sql/insertOne.js"
import { selectMany } from "../../../../../../../../utilities/sql/selectMany.js"
import { selectOne } from "../../../../../../../../utilities/sql/selectOne.js"

/**
 * Idempotency key of the generated balance-sheet closing entry. Used by the
 * key-based replacement below (never by a label match, which can drift).
 */
const SETTLE_BALANCE_SHEET_KEY = "settle-balance-sheet"

export const settleBalanceSheetRoute = apiFactory
    .createApp()
    .post(settleBalanceSheetRouteDefinition.path, async (c) => {
        const auth = await checkAuthMiddleware({
            context: c,
        })
        const idOrganization = await requireOrganizationMiddleware({
            idOrganization: auth.idOrganization,
        })
        const body = await validateBodyMiddleware({
            context: c,
            schema: settleBalanceSheetRouteDefinition.schemas.body,
        })

        const year = await selectOne({
            database: c.var.clients.sql,
            table: models.year,
            where: (table) => and(eq(table.idOrganization, idOrganization), eq(table.id, body.idYear)),
        })

        await c.var.clients.sql.transaction(async (tx) => {
            // Idempotency: replace the previously generated balance-sheet
            // closing entry for this year + journal (matched by idempotency
            // key, not by journal contents, so manually created entries in
            // the same journal are preserved).
            await deleteMany({
                database: tx,
                table: models.entry,
                where: (table) =>
                    and(
                        eq(table.idOrganization, idOrganization),
                        eq(table.idYear, body.idYear),
                        eq(table.idJournal, body.idJournalClosing),
                        eq(table.idempotencyKey, SETTLE_BALANCE_SHEET_KEY),
                    ),
            })

            // Fetch all balance-sheet accounts for this year
            const accounts = await selectMany({
                database: tx,
                table: models.account,
                where: (table) =>
                    and(
                        eq(table.idOrganization, idOrganization),
                        eq(table.idYear, body.idYear),
                        eq(table.type, "balance-sheet"),
                    ),
            })

            // Aggregate balance-sheet balances per account (lines flagged for
            // the balance sheet report exclude the generated entry itself,
            // making this idempotent).
            const balanceByIdAccount = await selectBalancesByIdAccount({
                database: tx,
                idOrganization,
                idYear: body.idYear,
                lineFlag: "isComputedForBalanceSheetReport",
            })

            // Build closing lines: reverse each account balance (skip class/2-digit accounts)
            const sheetLines: Array<typeof models.entryLine.$inferInsert> = []

            for (const account of accounts) {
                const algebraicBalance = balanceByIdAccount.get(account.id) ?? 0
                if (Math.abs(algebraicBalance) < 0.01) continue

                sheetLines.push({
                    id: generateId(),
                    idOrganization: idOrganization,
                    idYear: body.idYear,
                    idEntry: "", // filled after entry creation below
                    idAccount: account.id,
                    isComputedForJournalReport: true,
                    isComputedForLedgerReport: true,
                    isComputedForBalanceReport: true,
                    isComputedForBalanceSheetReport: false,
                    isComputedForIncomeStatementReport: false,
                    debit: algebraicBalance < 0 ? String((-algebraicBalance).toFixed(2)) : "0.00",
                    credit: algebraicBalance > 0 ? String(algebraicBalance.toFixed(2)) : "0.00",
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: null,
                    createdBy: auth.user.id,
                    lastUpdatedBy: null,
                })
            }

            if (sheetLines.length === 0) {
                throw new Exception({
                    statusCode: 400,
                    internalMessage: "No balance-sheet entries to close",
                    cause: "Aucune écriture de bilan ne peut être passée",
                })
            }

            // Create the closing entry
            const closingEntry = await insertOne({
                database: tx,
                table: models.entry,
                data: {
                    id: generateId(),
                    idOrganization: idOrganization,
                    idYear: body.idYear,
                    idJournal: body.idJournalClosing,
                    idFile: null,
                    idempotencyKey: SETTLE_BALANCE_SHEET_KEY,
                    label: "Solde des comptes de bilan",
                    date: year.endingAt,
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: null,
                    createdBy: auth.user.id,
                    lastUpdatedBy: null,
                },
            })

            // Assign entry id to all closing lines
            for (const line of sheetLines) {
                line.idEntry = closingEntry.id
            }

            await insertMany({
                database: tx,
                table: models.entryLine,
                data: sheetLines,
            })
        })

        return response({
            context: c,
            statusCode: 200,
            schema: settleBalanceSheetRouteDefinition.schemas.return,
            data: {},
        })
    })
