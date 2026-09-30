import { beforeAll, describe, expect, it } from "vitest"
import { type AuthSession, authenticatedRequest, getDemoYearId, signInAsDemo } from "../../helpers/auth.js"
import { verifyApiIsRunning } from "../../helpers/setup.js"

let session: AuthSession
let idOrganization: string
let idYear: string
let idAccount: string
let idOtherAccount: string

async function readAccounts(): Promise<
    Array<{
        id: string
        isSelectable: boolean
    }>
> {
    const response = await authenticatedRequest<
        Array<{
            id: string
            isSelectable: boolean
        }>
    >({
        session,
        method: "GET",
        path: `/organizations/${idOrganization}/years/${idYear}/accounts`,
    })
    return response.data
}

async function createEntry(label: string): Promise<string> {
    const response = await authenticatedRequest<{
        id: string
    }>({
        session,
        method: "POST",
        path: `/organizations/${idOrganization}/years/${idYear}/entries`,
        body: {
            label: label,
            date: "2024-03-01T00:00:00.000Z",
        },
    })
    expect(response.status).toBe(200)
    return response.data.id
}

async function createLine(parameters: {
    idEntry: string
    idAccount: string
    debit: string
    credit: string
}): Promise<string> {
    const response = await authenticatedRequest<{
        id: string
    }>({
        session,
        method: "POST",
        path: `/organizations/${idOrganization}/years/${idYear}/entries/${parameters.idEntry}/lines`,
        body: {
            idAccount: parameters.idAccount,
            isComputedForJournalReport: false,
            isComputedForLedgerReport: false,
            isComputedForBalanceReport: false,
            isComputedForBalanceSheetReport: false,
            isComputedForIncomeStatementReport: false,
            debit: parameters.debit,
            credit: parameters.credit,
        },
    })
    expect(response.status).toBe(200)
    return response.data.id
}

beforeAll(async () => {
    await verifyApiIsRunning()
    session = await signInAsDemo()
    const demo = await getDemoYearId(session)
    idOrganization = demo.idOrganization
    idYear = demo.idYear

    const accounts = await readAccounts()
    const selectable = accounts.filter((account) => account.isSelectable === true)
    expect(selectable.length).toBeGreaterThanOrEqual(2)
    idAccount = selectable[0]!.id
    idOtherAccount = selectable[1]!.id
})

describe("Matchings (lettrage)", () => {
    it("GET /matchings returns an array", async () => {
        const response = await authenticatedRequest({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings`,
        })
        expect(response.status).toBe(200)
        expect(Array.isArray(response.data)).toBe(true)
    })

    it("creates a matching, reads it back, then deletes it and unlinks its lines", async () => {
        const idEntry = await createEntry("Matching flow")
        const idLine1 = await createLine({
            idEntry: idEntry,
            idAccount: idAccount,
            debit: "25.00",
            credit: "0",
        })
        const idLine2 = await createLine({
            idEntry: idEntry,
            idAccount: idAccount,
            debit: "0",
            credit: "25.00",
        })

        const createResponse = await authenticatedRequest<{
            id: string
            code: string
            idAccount: string
        }>({
            session,
            method: "POST",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings`,
            body: {
                idYear: idYear,
                idAccount: idAccount,
                entryLineIds: [
                    idLine1,
                ],
            },
        })
        expect(createResponse.status).toBe(200)
        const matching = createResponse.data
        expect(matching.id).toBeTruthy()
        expect(matching.code).toBeTruthy()
        expect(matching.idAccount).toBe(idAccount)

        // It appears in the year list and can be read individually.
        const listResponse = await authenticatedRequest<
            Array<{
                id: string
            }>
        >({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings`,
        })
        expect(listResponse.data.some((item) => item.id === matching.id)).toBe(true)

        const readResponse = await authenticatedRequest<{
            id: string
        }>({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings/${matching.id}`,
        })
        expect(readResponse.status).toBe(200)
        expect(readResponse.data.id).toBe(matching.id)

        // Connecting a second line on the same account links it.
        const connectResponse = await authenticatedRequest<
            Array<{
                id: string
                idMatching: string | null
            }>
        >({
            session,
            method: "POST",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings/${matching.id}/lines`,
            body: {
                idYear: idYear,
                idMatching: matching.id,
                entryLineIds: [
                    idLine2,
                ],
            },
        })
        expect(connectResponse.status).toBe(200)
        expect(connectResponse.data.some((line) => line.id === idLine2 && line.idMatching === matching.id)).toBe(true)

        // An already-matched line cannot be attached again.
        const alreadyMatched = await authenticatedRequest({
            session,
            method: "POST",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings/${matching.id}/lines`,
            body: {
                idYear: idYear,
                idMatching: matching.id,
                entryLineIds: [
                    idLine2,
                ],
            },
        })
        expect(alreadyMatched.status).toBe(400)

        // Deleting the matching succeeds and unlinks its lines.
        const deleteResponse = await authenticatedRequest({
            session,
            method: "DELETE",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings/${matching.id}`,
            body: {
                idYear: idYear,
                idMatching: matching.id,
            },
        })
        expect(deleteResponse.status).toBe(200)

        const linesResponse = await authenticatedRequest<
            Array<{
                id: string
                idMatching: string | null
            }>
        >({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}/years/${idYear}/entries/lines?idEntry=${idEntry}`,
        })
        for (const line of linesResponse.data) {
            expect(line.idMatching ?? null).toBeNull()
        }

        const missingResponse = await authenticatedRequest({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings/${matching.id}`,
        })
        expect(missingResponse.status).toBe(400)
    })

    it("rejects a matching whose lines are not all on the matching account", async () => {
        const idEntry = await createEntry("Matching wrong account")
        const idLine = await createLine({
            idEntry: idEntry,
            idAccount: idAccount,
            debit: "5.00",
            credit: "0",
        })

        const response = await authenticatedRequest({
            session,
            method: "POST",
            path: `/organizations/${idOrganization}/years/${idYear}/matchings`,
            body: {
                idYear: idYear,
                idAccount: idOtherAccount,
                entryLineIds: [
                    idLine,
                ],
            },
        })
        expect(response.status).toBe(400)
    })
})

describe("Pointage (isCleared)", () => {
    it("clears and unclears entries in bulk", async () => {
        const idEntry = await createEntry("Pointage flow")

        const clearResponse = await authenticatedRequest<
            Array<{
                id: string
                isCleared: boolean
            }>
        >({
            session,
            method: "PATCH",
            path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            body: {
                idYear: idYear,
                idEntryIds: [
                    idEntry,
                ],
                isCleared: true,
            },
        })
        expect(clearResponse.status).toBe(200)
        expect(clearResponse.data.find((entry) => entry.id === idEntry)?.isCleared).toBe(true)

        const readAfterClear = await authenticatedRequest<{
            isCleared: boolean
        }>({
            session,
            method: "GET",
            path: `/organizations/${idOrganization}/years/${idYear}/entries/${idEntry}`,
        })
        expect(readAfterClear.data.isCleared).toBe(true)

        const unclearResponse = await authenticatedRequest<
            Array<{
                id: string
                isCleared: boolean
            }>
        >({
            session,
            method: "PATCH",
            path: `/organizations/${idOrganization}/years/${idYear}/entries`,
            body: {
                idYear: idYear,
                idEntryIds: [
                    idEntry,
                ],
                isCleared: false,
            },
        })
        expect(unclearResponse.status).toBe(200)
        expect(unclearResponse.data.find((entry) => entry.id === idEntry)?.isCleared).toBe(false)
    })

    it("toggles a single entry through updateOneEntry", async () => {
        const idEntry = await createEntry("Pointage single")

        const response = await authenticatedRequest<{
            isCleared: boolean
        }>({
            session,
            method: "PATCH",
            path: `/organizations/${idOrganization}/years/${idYear}/entries/${idEntry}`,
            body: {
                idYear: idYear,
                idEntry: idEntry,
                isCleared: true,
            },
        })
        expect(response.status).toBe(200)
        expect(response.data.isCleared).toBe(true)
    })
})
