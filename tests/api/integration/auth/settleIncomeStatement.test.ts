import { beforeAll, describe, expect, it } from "vitest"
import { type AuthSession, authenticatedRequest, getDemoYearId, signInAsDemo } from "../../helpers/auth.js"
import { verifyApiIsRunning } from "../../helpers/setup.js"

let session: AuthSession
let idOrganization: string
let idYear: string

beforeAll(async () => {
    await verifyApiIsRunning()
    session = await signInAsDemo()
    const demo = await getDemoYearId(session)
    idOrganization = demo.idOrganization
    idYear = demo.idYear
})

async function getOrCreateAccount(parameters: { label: string; number: string; parentNumber: string; type: string }) {
    const response = await authenticatedRequest({
        session,
        method: "GET",
        path: `/organizations/${idOrganization}/years/${idYear}/accounts`,
    })
    expect(response.status).toBe(200)

    const accounts = response.data as any[]
    const existing = accounts.find((account) => account.number === parameters.number)
    if (existing) return existing

    const parentAccount =
        accounts.find((account) => account.number === parameters.parentNumber) ??
        accounts.find((account) => account.number.length <= 2 && account.type === parameters.type)
    expect(parentAccount).toBeDefined()

    const createResponse = await authenticatedRequest({
        session,
        method: "POST",
        path: `/organizations/${idOrganization}/years/${idYear}/accounts`,
        body: {
            idAccountParent: parentAccount.id,
            idYear,
            isSelectable: true,
            label: parameters.label,
            number: parameters.number,
            type: parameters.type,
        },
    })
    expect(createResponse.status).toBe(200)
    return createResponse.data as any
}

describe("Settle income statement", () => {
    describe("POST /organizations/:idOrganization/years/:idYear/settle-income-statement", () => {
        it("creates a balanced closing entry with the result on the correct side", async () => {
            const journalResponse = await authenticatedRequest({
                session,
                method: "POST",
                path: `/organizations/${idOrganization}/years/${idYear}/journals`,
                body: {
                    code: `CL${Date.now().toString(36).slice(-3).toUpperCase()}`,
                    label: `Closing test ${Date.now()}`,
                },
            })
            expect(journalResponse.status).toBe(200)
            const idJournalClosing = (journalResponse.data as any).id

            const profitAccount = await getOrCreateAccount({
                label: "Résultat de l'exercice (bénéfice)",
                number: "120",
                parentNumber: "1",
                type: "balance-sheet",
            })
            const lossAccount = await getOrCreateAccount({
                label: "Résultat de l'exercice (perte)",
                number: "129",
                parentNumber: "1",
                type: "balance-sheet",
            })

            const settleResponse = await authenticatedRequest({
                session,
                method: "POST",
                path: `/organizations/${idOrganization}/years/${idYear}/settle-income-statement`,
                body: {
                    idAccountLoss: lossAccount.id,
                    idAccountProfit: profitAccount.id,
                    idJournalClosing,
                    idYear,
                },
            })
            expect(settleResponse.status).toBe(200)

            const entriesResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            })
            expect(entriesResponse.status).toBe(200)

            const entries = entriesResponse.data as any[]
            const closingEntry = entries.find(
                (entry) => entry.idJournal === idJournalClosing && entry.label === "Solde des comptes de gestion",
            )
            expect(closingEntry).toBeDefined()

            const linesResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries/lines?idYear=${idYear}&idEntry=${closingEntry.id}`,
            })
            expect(linesResponse.status).toBe(200)

            const lines = linesResponse.data as any[]
            const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0)
            const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0)
            expect(totalDebit).toBeCloseTo(totalCredit, 2)

            // Entry lines no longer carry a label: the result line is the one
            // booked on the profit/loss account (120/129), the rest are the
            // management-account closing lines.
            const resultLine = lines.find(
                (line) => line.idAccount === profitAccount.id || line.idAccount === lossAccount.id,
            )
            expect(resultLine).toBeDefined()

            const closingLines = lines.filter(
                (line) => line.idAccount !== profitAccount.id && line.idAccount !== lossAccount.id,
            )
            const closingDebit = closingLines.reduce((sum, line) => sum + Number(line.debit), 0)
            const closingCredit = closingLines.reduce((sum, line) => sum + Number(line.credit), 0)
            const algebraicResult = closingDebit - closingCredit

            if (algebraicResult > 0) {
                expect(resultLine.idAccount).toBe(profitAccount.id)
                expect(Number(resultLine.debit)).toBe(0)
                expect(Number(resultLine.credit)).toBeCloseTo(algebraicResult, 2)
            } else if (algebraicResult < 0) {
                expect(resultLine.idAccount).toBe(lossAccount.id)
                expect(Number(resultLine.credit)).toBe(0)
                expect(Number(resultLine.debit)).toBeCloseTo(-algebraicResult, 2)
            } else {
                expect([
                    profitAccount.id,
                    lossAccount.id,
                ]).toContain(resultLine.idAccount)
                expect(Number(resultLine.debit)).toBe(0)
                expect(Number(resultLine.credit)).toBe(0)
            }
        })
    })
})
