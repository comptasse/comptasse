import {
    buildScenarioEntries,
    describeScenarioParams,
    getScenarioDefinition,
    listScenarioDefinitions,
    scenarioCatalog,
} from "@comptasse/application-metadata"
import { describe, expect, it } from "vitest"

function totalLines(draft: {
    lines: Array<{
        debit: string
        credit: string
    }>
}): number {
    return draft.lines.reduce((sum, line) => sum + Number(line.debit) - Number(line.credit), 0)
}

describe("scenarioCatalog", () => {
    it("exposes the full documented catalogue", () => {
        const slugs = Object.keys(scenarioCatalog)
        expect(slugs.length).toBe(23)
        expect(getScenarioDefinition("note-de-frais")).toBeDefined()
        expect(getScenarioDefinition("inconnu")).toBeUndefined()
    })

    it("lists scenarios with slug/title/description", () => {
        const all = listScenarioDefinitions()
        for (const scenario of all) {
            expect(scenario.slug.length).toBeGreaterThan(0)
            expect(scenario.title.length).toBeGreaterThan(0)
            expect(scenario.description.length).toBeGreaterThan(0)
            if (scenario.mode === "params") {
                expect(scenario.buildEntries).toBeDefined()
            } else {
                expect(scenario.buildEntriesFromBalances).toBeDefined()
                expect([
                    "year",
                    "previousYear",
                ]).toContain(scenario.balancesSource)
            }
        }
    })

    it("builds balanced entries for every documented example", () => {
        for (const scenario of listScenarioDefinitions()) {
            for (const example of scenario.docExamples) {
                const drafts = buildScenarioEntries(scenario, example)
                expect(drafts.length).toBeGreaterThan(0)
                for (const draft of drafts) {
                    expect(totalLines(draft), `${scenario.slug}: ${draft.label}`).toBeCloseTo(0, 2)
                    for (const line of draft.lines) {
                        expect(line.debit).toMatch(/^\d+\.\d{2}$/)
                        expect(line.credit).toMatch(/^\d+\.\d{2}$/)
                    }
                }
            }
        }
    })
})

describe("param descriptions", () => {
    it("describes required/optional/choices", () => {
        const reglement = getScenarioDefinition("reglement-fournisseur")
        expect(reglement).toBeDefined()
        const params = describeScenarioParams(reglement!.paramsSchema)
        const amount = params.find((p) => p.name === "amount")
        expect(amount?.required).toBe(true)
        const discount = params.find((p) => p.name === "discountRate")
        expect(discount?.required).toBe(false)
        expect(discount?.default).toBe(0)

        const achat = describeScenarioParams(getScenarioDefinition("achat-marchandises-fournisseur")!.paramsSchema)
        const mode = achat.find((p) => p.name === "paymentMode")
        expect(mode?.type).toBe("choice")
        expect(mode?.choices).toContain("credit")
        expect(mode?.choices).toContain("bank")
    })
})

describe("key scenario outputs", () => {
    it("note-de-frais books expense then reimbursement", () => {
        const note = scenarioCatalog["note-de-frais"]
        const expense = note.buildEntries({
            amount: "150",
            expenseAccount: "625",
        })[0]
        expect(expense.lines[0]).toEqual({
            number: "625",
            label: "Frais professionnels",
            debit: "150.00",
            credit: "0.00",
        })
        expect(expense.lines[1].number).toBe("421")

        const reimbursement = note.buildEntries({
            amount: "150",
            reimburse: true,
        })[0]
        // reimburse path does not use expenseAccount
        expect(reimbursement.lines[0].number).toBe("421")
        expect(reimbursement.lines[1].number).toBe("512")
    })

    it("caution-depot-garantie books deposit then recovery", () => {
        const deposit = scenarioCatalog["caution-depot-garantie"].buildEntries({
            mode: "deposit",
            amount: "1200",
        })[0]
        expect(deposit.lines.map((line) => line.number)).toEqual([
            "275",
            "512",
        ])
        expect(deposit.lines[0].debit).toBe("1200.00")
        expect(deposit.lines[1].credit).toBe("1200.00")

        const recovery = scenarioCatalog["caution-depot-garantie"].buildEntries({
            mode: "recovery",
            amount: "1200",
        })[0]
        expect(recovery.lines.map((line) => line.number)).toEqual([
            "512",
            "275",
        ])
        expect(recovery.lines[0].debit).toBe("1200.00")
        expect(recovery.lines[1].credit).toBe("1200.00")
    })

    it("constitution-capital produces souscription + libération", () => {
        const drafts = scenarioCatalog["constitution-capital"].buildEntries({
            capitalAmount: "10000",
            liberatedAmount: "4000",
        })
        expect(drafts).toHaveLength(2)
        expect(drafts[0].lines.map((l) => l.number)).toEqual([
            "4561",
            "101",
        ])
        expect(drafts[1].lines.map((l) => l.number)).toEqual([
            "512",
            "4561",
        ])
    })

    it("vente-prestation-services splits HT and VAT", () => {
        const [draft] = scenarioCatalog["vente-prestation-services"].buildEntries({
            amountHT: "5000",
            vatRate: 20,
        })
        expect(draft.lines.find((l) => l.number === "706")?.credit).toBe("5000.00")
        expect(draft.lines.find((l) => l.number === "44571")?.credit).toBe("1000.00")
        expect(draft.lines.find((l) => l.number === "411")?.debit).toBe("6000.00")
    })

    it("reglement-fournisseur applies early-payment discount", () => {
        const [draft] = scenarioCatalog["reglement-fournisseur"].buildEntries({
            amount: "1200",
            discountRate: 2,
        })
        expect(draft.lines.find((l) => l.number === "401")?.debit).toBe("1200.00")
        expect(draft.lines.find((l) => l.number === "765")?.credit).toBe("24.00")
        expect(draft.lines.find((l) => l.number === "512")?.credit).toBe("1176.00")
    })

    it("tva-declaration handles credit case without payNow entry", () => {
        const drafts = scenarioCatalog["tva-declaration-mensuelle"].buildEntries({
            collectedVat: "200",
            deductibleVat: "400",
        })
        expect(drafts).toHaveLength(1)
        const debit44551 = drafts[0].lines.find((l) => l.number === "44551" && Number(l.debit) > 0)
        expect(debit44551).toBeDefined()
        expect(Number(debit44551!.debit)).toBe(200)
    })

    it("cloture-exercice reverses income-statement balances and books the result", () => {
        const cloture = scenarioCatalog["cloture-exercice"]
        expect(cloture.mode).toBe("balances")
        expect(cloture.balancesSource).toBe("year")

        const [draft] = buildScenarioEntries(cloture, {
            description: "",
            params: {},
            balances: [
                {
                    number: "607",
                    label: "Achats de marchandises",
                    balance: 10000,
                },
                {
                    number: "707",
                    label: "Ventes de marchandises",
                    balance: -15000,
                },
            ],
        })
        expect(draft.label).toBe("Solde des comptes de gestion")
        // A debit balance (charge) is credited; a credit balance (product) is debited
        const chargeReversal = draft.lines.find((l) => l.number === "607")
        expect(chargeReversal).toMatchObject({
            debit: "0.00",
            credit: "10000.00",
        })
        const productReversal = draft.lines.find((l) => l.number === "707")
        expect(productReversal).toMatchObject({
            debit: "15000.00",
            credit: "0.00",
        })
        // Profit of 5 000 € booked as a credit on the profit account
        const result = draft.lines.find((l) => l.number === "120")
        expect(result).toMatchObject({
            debit: "0.00",
            credit: "5000.00",
        })
        expect(totalLines(draft)).toBeCloseTo(0, 2)
        // Closing lines must not be counted in the income statement report
        for (const line of draft.lines) {
            expect(line.reportFlags?.isComputedForIncomeStatementReport).toBe(false)
        }
    })

    it("cloture-exercice books a loss on the loss account", () => {
        const cloture = scenarioCatalog["cloture-exercice"]
        const [draft] = buildScenarioEntries(cloture, {
            description: "",
            params: {},
            balances: [
                {
                    number: "607",
                    label: "Achats de marchandises",
                    balance: 8000,
                },
                {
                    number: "706",
                    label: "Prestations de services",
                    balance: -6500,
                },
            ],
        })
        const loss = draft.lines.find((l) => l.number === "129")
        expect(loss).toMatchObject({
            debit: "1500.00",
            credit: "0.00",
        })
        expect(draft.lines.find((l) => l.number === "120")).toBeUndefined()
        expect(totalLines(draft)).toBeCloseTo(0, 2)
    })

    it("cloture-exercice supports custom profit/loss accounts", () => {
        const cloture = scenarioCatalog["cloture-exercice"]
        const [draft] = buildScenarioEntries(cloture, {
            description: "",
            params: {
                profitAccount: "1200",
                lossAccount: "1290",
            },
            balances: [
                {
                    number: "607",
                    label: "Achats",
                    balance: 1000,
                },
                {
                    number: "707",
                    label: "Ventes",
                    balance: -3000,
                },
            ],
        })
        expect(draft.lines.find((l) => l.number === "1200")?.credit).toBe("2000.00")
        expect(draft.lines.find((l) => l.number === "1290")).toBeUndefined()
    })

    it("cloture-exercice returns no draft when balances are all zero", () => {
        const cloture = scenarioCatalog["cloture-exercice"]
        const drafts = buildScenarioEntries(cloture, {
            description: "",
            params: {},
            balances: [
                {
                    number: "707",
                    label: "Ventes",
                    balance: 0,
                },
            ],
        })
        expect(drafts).toHaveLength(0)
    })

    it("ouverture-exercice re-establishes balance-sheet balances in the same direction", () => {
        const ouverture = scenarioCatalog["ouverture-exercice"]
        expect(ouverture.mode).toBe("balances")
        expect(ouverture.balancesSource).toBe("previousYear")

        const [draft] = buildScenarioEntries(ouverture, {
            description: "",
            params: {},
            balances: [
                {
                    number: "512",
                    label: "Banques",
                    balance: 13000,
                },
                {
                    number: "101",
                    label: "Capital",
                    balance: -5000,
                },
                {
                    number: "164",
                    label: "Emprunts auprès des établissements de crédit",
                    balance: -5000,
                },
                {
                    number: "120",
                    label: "Résultat de l'exercice - bénéfice",
                    balance: -3000,
                },
            ],
        })
        expect(draft.label).toBe("Report du bilan de l'exercice précédent")
        // A debit balance is re-established as a debit line, a credit balance
        // as a credit line — the opposite of the settle direction.
        const bank = draft.lines.find((l) => l.number === "512")
        expect(bank).toMatchObject({
            debit: "13000.00",
            credit: "0.00",
        })
        const capital = draft.lines.find((l) => l.number === "101")
        expect(capital).toMatchObject({
            debit: "0.00",
            credit: "5000.00",
        })
        const loan = draft.lines.find((l) => l.number === "164")
        expect(loan).toMatchObject({
            debit: "0.00",
            credit: "5000.00",
        })
        const result = draft.lines.find((l) => l.number === "120")
        expect(result).toMatchObject({
            debit: "0.00",
            credit: "3000.00",
        })
        expect(totalLines(draft)).toBeCloseTo(0, 2)
        // Opening lines belong to the balance sheet, not the income statement
        for (const line of draft.lines) {
            expect(line.reportFlags?.isComputedForIncomeStatementReport).toBe(false)
        }
    })

    it("ouverture-exercice returns no draft when there is nothing to carry forward", () => {
        const ouverture = scenarioCatalog["ouverture-exercice"]
        const drafts = buildScenarioEntries(ouverture, {
            description: "",
            params: {},
            balances: [
                {
                    number: "512",
                    label: "Banques",
                    balance: 0,
                },
            ],
        })
        expect(drafts).toHaveLength(0)
    })
})
