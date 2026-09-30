import { generateFecRouteDefinition, models } from "@comptasse/application-metadata"
import { and, eq } from "drizzle-orm"
import { checkAuthMiddleware } from "../../../../../../../middlewares/checkAuthMiddleware.js"
import { requireOrganizationMiddleware } from "../../../../../../../middlewares/requireOrganizationMiddleware.js"
import { validateBodyMiddleware } from "../../../../../../../middlewares/validateBody.middleware.js"
import { apiFactory } from "../../../../../../../utilities/apiFactory.js"
import { response } from "../../../../../../../utilities/response.js"
import { selectMany } from "../../../../../../../utilities/sql/selectMany.js"
import { selectOne } from "../../../../../../../utilities/sql/selectOne.js"
import { generateGetSignedUrl } from "../../../../../../../utilities/storage/generateGetSignedUrl.js"
import { putObject } from "../../../../../../../utilities/storage/putObject.js"

// ---------------------------------------------------------------------------
// FEC helpers
// ---------------------------------------------------------------------------

/**
 * Format a date string as YYYYMMDD for FEC compliance.
 */
function formatFecDate(rawDate: string | Date): string {
    const date = new Date(rawDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}${month}${day}`
}

/**
 * Format a numeric amount for FEC: comma decimal separator, no thousands, 2 decimals.
 * e.g. 1234.5 -> "1234,50"
 */
function formatFecAmount(value: number | string): string {
    const num = Number(value)
    const abs = Math.abs(num) < 0.009 ? 0 : num
    return abs.toFixed(2).replace(".", ",")
}

const FEC_HEADERS = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
] as const

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const generateFecRoute = apiFactory.createApp().post(generateFecRouteDefinition.path, async (c) => {
    const auth = await checkAuthMiddleware({
        context: c,
    })
    const idOrganization = await requireOrganizationMiddleware({
        idOrganization: auth.idOrganization,
    })
    const body = await validateBodyMiddleware({
        context: c,
        schema: generateFecRouteDefinition.schemas.body,
    })

    const [organization, entries, entryLines, accounts, journals, matchings] = await Promise.all([
        selectOne({
            database: c.var.clients.sql,
            table: models.organization,
            where: (t) => eq(t.id, idOrganization),
        }),
        selectMany({
            database: c.var.clients.sql,
            table: models.entry,
            where: (t) => and(eq(t.idOrganization, idOrganization), eq(t.idYear, body.idYear)),
        }),
        selectMany({
            database: c.var.clients.sql,
            table: models.entryLine,
            where: (t) => and(eq(t.idOrganization, idOrganization), eq(t.idYear, body.idYear)),
        }),
        selectMany({
            database: c.var.clients.sql,
            table: models.account,
            where: (t) => and(eq(t.idOrganization, idOrganization), eq(t.idYear, body.idYear)),
        }),
        selectMany({
            database: c.var.clients.sql,
            table: models.journal,
            where: (t) => eq(t.idOrganization, idOrganization),
        }),
        selectMany({
            database: c.var.clients.sql,
            table: models.matching,
            where: (t) => and(eq(t.idOrganization, idOrganization), eq(t.idYear, body.idYear)),
        }),
    ])

    const accountsMap = new Map(
        accounts.map((a) => [
            a.id,
            {
                number: a.number,
                label: a.label,
            },
        ]),
    )
    const journalsMap = new Map(
        journals.map((j) => [
            j.id,
            {
                code: j.code,
                label: j.label,
            },
        ]),
    )
    const entriesMap = new Map(
        entries.map((e) => [
            e.id,
            e,
        ]),
    )
    const matchingCodeById = new Map(
        matchings.map((matching) => [
            matching.id,
            matching.code,
        ]),
    )

    // Build sequential EcritureNum per entry, sorted by date then id
    const sortedEntries = [
        ...entries,
    ].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.id.localeCompare(b.id)
    })
    const ecritureNumMap = new Map<string, string>()
    for (let i = 0; i < sortedEntries.length; i++) {
        ecritureNumMap.set(sortedEntries[i].id, String(i + 1))
    }

    // Sort rows by entry date, then EcritureNum, then row id
    const sortedRows = [
        ...entryLines,
    ].sort((a, b) => {
        const entryA = entriesMap.get(a.idEntry)
        const entryB = entriesMap.get(b.idEntry)
        if (!entryA || !entryB) return 0
        const dateCompare = entryA.date.localeCompare(entryB.date)
        if (dateCompare !== 0) return dateCompare
        const numCompare = (ecritureNumMap.get(a.idEntry) ?? "").localeCompare(
            ecritureNumMap.get(b.idEntry) ?? "",
            undefined,
            {
                numeric: true,
            },
        )
        if (numCompare !== 0) return numCompare
        return a.id.localeCompare(b.id)
    })

    const rows = sortedRows
        .map((row) => {
            const entry = entriesMap.get(row.idEntry)
            if (!entry) return null

            const account = accountsMap.get(row.idAccount)
            const journal = entry.idJournal ? journalsMap.get(entry.idJournal) : null

            const ecritureDate = formatFecDate(entry.date)
            const pieceDate = formatFecDate(entry.date)
            const validDate = formatFecDate(entry.createdAt)

            return [
                journal?.code ?? "",
                journal?.label ?? "",
                ecritureNumMap.get(entry.id) ?? "",
                ecritureDate,
                account?.number ?? "",
                account?.label ?? "",
                "", // CompAuxNum - not supported
                "", // CompAuxLib - not supported
                entry.label, // PieceRef
                pieceDate,
                entry.label, // EcritureLib
                formatFecAmount(row.debit),
                formatFecAmount(row.credit),
                row.idMatching ? (matchingCodeById.get(row.idMatching) ?? "") : "", // EcritureLet
                "", // DateLet - not supported
                validDate,
                "", // Montantdevise
                "", // Idevise
            ].join("\t")
        })
        .filter((row): row is string => row !== null)

    const BOM = "\uFEFF"
    const fecContent =
        BOM +
        [
            FEC_HEADERS.join("\t"),
            ...rows,
        ].join("\n")

    const filename = `${organization.name}FEC${formatFecDate(new Date())}.txt`
    const fecBuffer = Buffer.from(fecContent, "utf-8")
    const storageKey = `organizations/${idOrganization}/${body.idYear}/exports/fec.txt`

    await putObject({
        var: c.var,
        body: fecBuffer,
        storageKey,
        contentType: "text/plain;charset=utf-8",
        contentLength: fecBuffer.length,
        metadata: {
            idOrganization,
            idYear: body.idYear,
            idUser: auth.user.id,
            filename,
        },
    })

    const url = await generateGetSignedUrl({
        var: c.var,
        storageKey,
    })

    return response({
        context: c,
        statusCode: 200,
        schema: generateFecRouteDefinition.schemas.return,
        data: {
            url,
        },
    })
})
