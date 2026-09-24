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

describe("Entries", () => {
    describe("GET /organizations/:idOrganization/years/:idYear/entries", () => {
        it("returns all entries for the year", async () => {
            const response = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            })
            expect(response.status).toBe(200)

            const data = response.data as any[]
            expect(Array.isArray(data)).toBe(true)
            expect(data.length).toBeGreaterThan(0)

            const entry = data[0]
            expect(entry).toHaveProperty("id")
            expect(entry).toHaveProperty("label")
            expect(entry).toHaveProperty("date")
        })
    })

    describe("POST /organizations/:idOrganization/years/:idYear/entries", () => {
        it("creates a new entry", async () => {
            const response = await authenticatedRequest({
                session,
                method: "POST",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
                body: {
                    label: "Test Entry",
                    date: "2023-06-15T00:00:00.000Z",
                },
            })
            expect(response.status).toBe(200)

            const data = response.data as any
            expect(data).toHaveProperty("id")
            expect(data.label).toBe("Test Entry")
        })

        it("rejects missing required fields", async () => {
            const response = await authenticatedRequest({
                session,
                method: "POST",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
                body: {},
            })
            expect(response.status).toBe(400)
        })
    })
})

describe("Entry Lines", () => {
    describe("GET /organizations/:idOrganization/years/:idYear/entries/lines", () => {
        it("returns all entry lines for the year without requiring idEntry", async () => {
            const entriesResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            })
            const entries = entriesResponse.data as any[]
            expect(entries.length).toBeGreaterThan(0)
            const idEntry = entries[0].id

            const accountsResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/accounts`,
            })
            const accounts = accountsResponse.data as any[]
            const selectableAccount = accounts.find((a: any) => a.isSelectable === true)

            const createResponse = await authenticatedRequest({
                session,
                method: "POST",
                path: `/organizations/${idOrganization}/years/${idYear}/entries/${idEntry}/lines`,
                body: {
                    idAccount: selectableAccount.id,
                    isComputedForJournalReport: true,
                    isComputedForLedgerReport: true,
                    isComputedForBalanceReport: true,
                    isComputedForBalanceSheetReport: true,
                    isComputedForIncomeStatementReport: true,
                    label: "Regression Line",
                    debit: "1.00",
                    credit: "0",
                },
            })
            expect(createResponse.status).toBe(200)
            const createdLineId = (createResponse.data as any).id

            const response = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries/lines`,
            })
            expect(response.status).toBe(200)

            const data = response.data as any[]
            expect(Array.isArray(data)).toBe(true)
            if (data.length > 0) {
                const line = data[0]
                expect(line).toHaveProperty("id")
                expect(line).toHaveProperty("idEntry")
                expect(line).toHaveProperty("idAccount")
            }
            // Regression: this returned [] when the route required a missing :idEntry.
            expect(data.some((line) => line.id === createdLineId)).toBe(true)
        })

        it("filters entry lines by idEntry query parameter", async () => {
            const entriesResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            })
            const entries = entriesResponse.data as any[]
            expect(entries.length).toBeGreaterThan(0)
            const idEntry = entries[0].id

            const response = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries/lines?idEntry=${idEntry}`,
            })
            expect(response.status).toBe(200)

            const data = response.data as any[]
            expect(Array.isArray(data)).toBe(true)
            for (const line of data) {
                expect(line.idEntry).toBe(idEntry)
            }
        })
    })

    describe("POST /organizations/:idOrganization/years/:idYear/entries/:idEntry/lines", () => {
        it("creates a new entry line on an existing entry", async () => {
            // Get an entry and an account
            const entriesResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            })
            const entries = entriesResponse.data as any[]
            const idEntry = entries[0].id

            const accountsResponse = await authenticatedRequest({
                session,
                method: "GET",
                path: `/organizations/${idOrganization}/years/${idYear}/accounts`,
            })
            const accounts = accountsResponse.data as any[]
            const selectableAccount = accounts.find((a: any) => a.isSelectable === true)

            const response = await authenticatedRequest({
                session,
                method: "POST",
                path: `/organizations/${idOrganization}/years/${idYear}/entries/${idEntry}/lines`,
                body: {
                    idAccount: selectableAccount.id,
                    isComputedForJournalReport: true,
                    isComputedForLedgerReport: true,
                    isComputedForBalanceReport: true,
                    isComputedForBalanceSheetReport: true,
                    isComputedForIncomeStatementReport: true,
                    label: "Test Line",
                    debit: "100.00",
                    credit: "0",
                },
            })
            expect(response.status).toBe(200)

            const data = response.data as any
            expect(data).toHaveProperty("id")
            expect(data.idEntry).toBe(idEntry)
            expect(data.label).toBe("Test Line")
        })
    })
})
