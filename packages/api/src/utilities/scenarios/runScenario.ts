import { generateId, models, type ScenarioReportFlags } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { Exception } from "../exception.js"
import { deleteMany } from "../sql/deleteMany.js"
import { insertMany } from "../sql/insertMany.js"
import { insertOne } from "../sql/insertOne.js"

type InsertableDatabase = Parameters<typeof insertOne>[0]["database"]

export type ScenarioAccount = {
    id: string
    number: string
}

export type ScenarioLineDraft = {
    number: string
    label: string
    debit: string
    credit: string
    reportFlags?: Partial<ScenarioReportFlags>
}

export type ScenarioEntryDraft = {
    label: string
    lines: ScenarioLineDraft[]
}

export function resolveScenarioAccounts(parameters: { lines: ScenarioLineDraft[]; accounts: ScenarioAccount[] }): {
    resolved: Array<{
        idAccount: string
        line: ScenarioLineDraft
    }>
    missingNumbers: string[]
} {
    const idByNumber = new Map(
        parameters.accounts.map((account) => [
            account.number,
            account.id,
        ]),
    )
    const resolved: Array<{
        idAccount: string
        line: ScenarioLineDraft
    }> = []
    const missing = new Set<string>()
    for (const line of parameters.lines) {
        const idAccount = idByNumber.get(line.number)
        if (idAccount === undefined) {
            missing.add(line.number)
            continue
        }
        resolved.push({
            idAccount,
            line,
        })
    }
    return {
        resolved,
        missingNumbers: [
            ...missing,
        ],
    }
}

export function assertScenariosBalanced(drafts: ScenarioEntryDraft[]): void {
    for (const draft of drafts) {
        const debit = draft.lines.reduce((sum, l) => sum + Number(l.debit), 0)
        const credit = draft.lines.reduce((sum, l) => sum + Number(l.credit), 0)
        if (Math.abs(debit - credit) > 0.005) {
            throw new Exception({
                statusCode: 500,
                internalMessage: `Scenario entry "${draft.label}" is not balanced`,
                externalMessage: "Le scénario a produit une écriture déséquilibrée",
            })
        }
    }
}

export async function createScenarioEntries(parameters: {
    database: InsertableDatabase
    idOrganization: string
    idYear: string
    userId: string
    drafts: ScenarioEntryDraft[]
    idJournal: string
    date?: string | null
    accounts: ScenarioAccount[]
    /**
     * Written to the created entries so that a later idempotent run can
     * replace them. Required when replaceExisting is true.
     */
    idempotencyKey?: string | null
    /**
     * Deletes the entries previously generated for the same idempotency key
     * in the same year + journal before inserting (idempotent replay).
     */
    replaceExisting?: boolean
}): Promise<
    Array<{
        entry: unknown
        lines: unknown[]
    }>
> {
    const drafts = parameters.drafts
    if (drafts.length === 0) {
        throw new Exception({
            statusCode: 400,
            internalMessage: "Scenario produced no entries",
            externalMessage: "Le scénario n'a produit aucune écriture",
        })
    }
    assertScenariosBalanced(drafts)

    const allLines = drafts.flatMap((draft) => draft.lines)
    const { resolved, missingNumbers } = resolveScenarioAccounts({
        lines: allLines,
        accounts: parameters.accounts,
    })
    if (missingNumbers.length > 0) {
        throw new Exception({
            statusCode: 400,
            internalMessage: `Unknown account numbers: ${missingNumbers.join(", ")}`,
            externalMessage: `Comptes introuvables dans le plan de cet exercice : ${missingNumbers.join(", ")}`,
        })
    }

    const date = parameters.date ?? new Date().toISOString()
    const created: Array<{
        entry: unknown
        lines: unknown[]
    }> = []
    let lineCursor = 0

    await parameters.database.transaction(async (tx) => {
        const idempotencyKey = parameters.idempotencyKey
        if (parameters.replaceExisting === true && typeof idempotencyKey === "string") {
            await deleteMany({
                database: tx,
                table: models.entry,
                where: (table) =>
                    and(
                        eq(table.idOrganization, parameters.idOrganization),
                        eq(table.idYear, parameters.idYear),
                        eq(table.idJournal, parameters.idJournal),
                        eq(table.idempotencyKey, idempotencyKey),
                    ),
            })
        }

        for (const draft of drafts) {
            const entry = await insertOne({
                database: tx,
                table: models.entry,
                data: {
                    id: generateId(),
                    idOrganization: parameters.idOrganization,
                    idYear: parameters.idYear,
                    idJournal: parameters.idJournal,
                    idFile: null,
                    idempotencyKey: parameters.idempotencyKey ?? null,
                    label: draft.label,
                    date,
                    createdAt: new Date().toISOString(),
                    lastUpdatedAt: null,
                    createdBy: parameters.userId,
                    lastUpdatedBy: null,
                },
            })

            const count = draft.lines.length
            const draftLines = resolved.slice(lineCursor, lineCursor + count)
            lineCursor += count

            const rows = draftLines.map(({ idAccount, line }) => ({
                id: generateId(),
                idOrganization: parameters.idOrganization,
                idYear: parameters.idYear,
                idEntry: entry.id,
                idAccount,
                isComputedForJournalReport: line.reportFlags?.isComputedForJournalReport ?? true,
                isComputedForLedgerReport: line.reportFlags?.isComputedForLedgerReport ?? true,
                isComputedForBalanceReport: line.reportFlags?.isComputedForBalanceReport ?? true,
                isComputedForBalanceSheetReport: line.reportFlags?.isComputedForBalanceSheetReport ?? true,
                isComputedForIncomeStatementReport: line.reportFlags?.isComputedForIncomeStatementReport ?? true,
                debit: line.debit,
                credit: line.credit,
                createdAt: new Date().toISOString(),
                lastUpdatedAt: null,
                createdBy: parameters.userId,
                lastUpdatedBy: null,
            }))
            await insertMany({
                database: tx,
                table: models.entryLine,
                data: rows,
            })
            created.push({
                entry,
                lines: rows,
            })
        }
    })

    return created
}
