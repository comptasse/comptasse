import {
    readAllAccountsRouteDefinition,
    readAllBalanceSheetsRouteDefinition,
    readAllComputationIncomeStatementsRouteDefinition,
    readAllComputationsRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllEntryTagsRouteDefinition,
    readAllFilesRouteDefinition,
    readAllFoldersRouteDefinition,
    readAllIncomeStatementsRouteDefinition,
    readAllJournalsRouteDefinition,
    readAllMatchingsRouteDefinition,
    readAllTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import { CircularLoader, FormatError } from "@comptasse/ui"
import { useQueries } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { ReactElement } from "react"
import { useMemo } from "react"
import type * as v from "valibot"
import { ClientError } from "../../../utilities/clientError.ts"
import { getResponseBodyFromAPI } from "../../../utilities/getResponseBodyFromAPI.ts"
import { buildQueryKey } from "../../../utilities/queryKey.ts"

const yearQueries = {
    accounts: readAllAccountsRouteDefinition,
    entries: readAllEntriesRouteDefinition,
    entryLines: readAllEntryLinesRouteDefinition,
    entryTags: readAllEntryTagsRouteDefinition,
    journals: readAllJournalsRouteDefinition,
    matchings: readAllMatchingsRouteDefinition,
    tags: readAllTagsRouteDefinition,
    files: readAllFilesRouteDefinition,
    folders: readAllFoldersRouteDefinition,
    balanceSheets: readAllBalanceSheetsRouteDefinition,
    incomeStatements: readAllIncomeStatementsRouteDefinition,
    computations: readAllComputationsRouteDefinition,
    computationIncomeStatements: readAllComputationIncomeStatementsRouteDefinition,
} as const

type YearQueries = typeof yearQueries

type YearData = {
    [K in keyof YearQueries]: v.InferOutput<YearQueries[K]["schemas"]["return"]>
}

export type YearDataKey = keyof YearData

// Pre-built index maps for O(1) lookups — computed once per data change, shared by all consumers.
export type YearDataMaps = {
    entryById: Map<string, YearData["entries"][number]>
    entryLinesByEntryId: Map<string, Array<YearData["entryLines"][number]>>
    entryTagsByEntryId: Map<string, Array<YearData["entryTags"][number]>>
    journalById: Map<string, YearData["journals"][number]>
    tagById: Map<string, YearData["tags"][number]>
    fileById: Map<string, YearData["files"][number]>
    folderById: Map<string, YearData["folders"][number]>
    accountById: Map<string, YearData["accounts"][number]>
    accountByNumber: Map<string, YearData["accounts"][number]>
    balanceSheetById: Map<string, YearData["balanceSheets"][number]>
    incomeStatementById: Map<string, YearData["incomeStatements"][number]>
    matchingById: Map<string, YearData["matchings"][number]>
    computationById: Map<string, YearData["computations"][number]>
}

type YearScopedRouteDefinition = {
    method: "GET" | "POST" | "PATCH" | "DELETE"
    path: string
    name: string | undefined
    schemas: {
        body: v.ObjectSchema<v.ObjectEntries, undefined>
        return:
            | v.ObjectSchema<v.ObjectEntries, undefined>
            | v.ArraySchema<v.ObjectSchema<v.ObjectEntries, undefined>, undefined>
    }
}

const yearQueryEntries = Object.entries(yearQueries) as [
    YearDataKey,
    YearScopedRouteDefinition,
][]

// Stable index for dereferencing results by key name (avoids magic numbers).
const KEY_INDEX = Object.fromEntries(
    yearQueryEntries.map(([key], i) => [
        key,
        i,
    ]),
) as Record<YearDataKey, number>

export function YearDataWrapper<const K extends readonly YearDataKey[]>(props: {
    idYear: string
    requiredKeys: K
    children: (data: Pick<YearData, K[number]> & YearDataMaps) => ReactElement | null
}) {
    const urlParams = useParams({
        strict: false,
    })
    const body = useMemo(
        () => ({
            idYear: props.idYear,
        }),
        [
            props.idYear,
        ],
    )

    const params = useMemo(() => {
        const result: Record<string, string> = {}
        if (typeof urlParams.idOrganization === "string") {
            result.idOrganization = urlParams.idOrganization
        }
        return result
    }, [
        urlParams.idOrganization,
    ])

    const requiredKeySet = useMemo(
        () => new Set<YearDataKey>(props.requiredKeys),
        [
            props.requiredKeys,
        ],
    )

    const results = useQueries({
        queries: yearQueryEntries.map(([key, routeDef]) => ({
            queryKey: buildQueryKey(routeDef, body as Record<string, unknown>, params),
            queryFn: async (context: { signal: AbortSignal }) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: routeDef,
                    body,
                    params,
                    signal: context.signal,
                })
                if (response.ok === false) {
                    throw new ClientError({
                        message: "Error with the data fetching",
                        rawError: response.error,
                    })
                }
                return response.data
            },
            retry: 1,
            staleTime: Number.POSITIVE_INFINITY,
            enabled: requiredKeySet.has(key),
        })),
    })

    const requiredIndices = useMemo(
        () => props.requiredKeys.map((key) => KEY_INDEX[key]),
        [
            props.requiredKeys,
        ],
    )

    const isPending = requiredIndices.some((index) => results[index].isPending)
    const isError = requiredIndices.some((index) => results[index].isError)

    // Extract each query's data to individual stable references so downstream useMemo deps
    // only invalidate when the actual data changes, not on every YearDataWrapper render.
    const accountsData = results[KEY_INDEX.accounts].data as YearData["accounts"] | undefined
    const entriesData = results[KEY_INDEX.entries].data as YearData["entries"] | undefined
    const entryLinesData = results[KEY_INDEX.entryLines].data as YearData["entryLines"] | undefined
    const entryTagsData = results[KEY_INDEX.entryTags].data as YearData["entryTags"] | undefined
    const journalsData = results[KEY_INDEX.journals].data as YearData["journals"] | undefined
    const matchingsData = results[KEY_INDEX.matchings].data as YearData["matchings"] | undefined
    const tagsData = results[KEY_INDEX.tags].data as YearData["tags"] | undefined
    const filesData = results[KEY_INDEX.files].data as YearData["files"] | undefined
    const foldersData = results[KEY_INDEX.folders].data as YearData["folders"] | undefined
    const balanceSheetsData = results[KEY_INDEX.balanceSheets].data as YearData["balanceSheets"] | undefined
    const incomeStatementsData = results[KEY_INDEX.incomeStatements].data as YearData["incomeStatements"] | undefined
    const computationsData = results[KEY_INDEX.computations].data as YearData["computations"] | undefined
    const computationIncomeStatementsData = results[KEY_INDEX.computationIncomeStatements].data as
        | YearData["computationIncomeStatements"]
        | undefined

    // Memoized raw-array object — reference stable as long as query data references don't change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const arrays = useMemo(
        () => ({
            accounts: accountsData ?? [],
            entries: entriesData ?? [],
            entryLines: entryLinesData ?? [],
            entryTags: entryTagsData ?? [],
            journals: journalsData ?? [],
            matchings: matchingsData ?? [],
            tags: tagsData ?? [],
            files: filesData ?? [],
            folders: foldersData ?? [],
            balanceSheets: balanceSheetsData ?? [],
            incomeStatements: incomeStatementsData ?? [],
            computations: computationsData ?? [],
            computationIncomeStatements: computationIncomeStatementsData ?? [],
        }),
        // Each individual data reference from React Query cache — stable until data actually changes.
        [
            accountsData,
            entriesData,
            entryLinesData,
            entryTagsData,
            journalsData,
            matchingsData,
            tagsData,
            filesData,
            foldersData,
            balanceSheetsData,
            incomeStatementsData,
            computationsData,
            computationIncomeStatementsData,
        ],
    )

    // ── Pre-built index maps ─────────────────────────────────────────────────
    // Each map is memoized independently so only the affected map rebuilds when its source changes.

    const entryById = useMemo(() => {
        const m = new Map<string, YearData["entries"][number]>()
        for (const e of arrays.entries) m.set(e.id, e)
        return m
    }, [
        arrays.entries,
    ])

    const entryLinesByEntryId = useMemo(() => {
        const m = new Map<string, Array<YearData["entryLines"][number]>>()
        for (const line of arrays.entryLines) {
            const arr = m.get(line.idEntry)
            if (arr) arr.push(line)
            else
                m.set(line.idEntry, [
                    line,
                ])
        }
        return m
    }, [
        arrays.entryLines,
    ])

    const entryTagsByEntryId = useMemo(() => {
        const m = new Map<string, Array<YearData["entryTags"][number]>>()
        for (const et of arrays.entryTags) {
            const arr = m.get(et.idEntry)
            if (arr) arr.push(et)
            else
                m.set(et.idEntry, [
                    et,
                ])
        }
        return m
    }, [
        arrays.entryTags,
    ])

    const journalById = useMemo(() => {
        const m = new Map<string, YearData["journals"][number]>()
        for (const j of arrays.journals) m.set(j.id, j)
        return m
    }, [
        arrays.journals,
    ])

    const tagById = useMemo(() => {
        const m = new Map<string, YearData["tags"][number]>()
        for (const t of arrays.tags) m.set(t.id, t)
        return m
    }, [
        arrays.tags,
    ])

    const fileById = useMemo(() => {
        const m = new Map<string, YearData["files"][number]>()
        for (const f of arrays.files) m.set(f.id, f)
        return m
    }, [
        arrays.files,
    ])

    const folderById = useMemo(() => {
        const m = new Map<string, YearData["folders"][number]>()
        for (const f of arrays.folders) m.set(f.id, f)
        return m
    }, [
        arrays.folders,
    ])

    const accountById = useMemo(() => {
        const m = new Map<string, YearData["accounts"][number]>()
        for (const a of arrays.accounts) m.set(a.id, a)
        return m
    }, [
        arrays.accounts,
    ])

    const accountByNumber = useMemo(() => {
        const m = new Map<string, YearData["accounts"][number]>()
        for (const a of arrays.accounts) m.set(a.number, a)
        return m
    }, [
        arrays.accounts,
    ])

    const balanceSheetById = useMemo(() => {
        const m = new Map<string, YearData["balanceSheets"][number]>()
        for (const bs of arrays.balanceSheets) m.set(bs.id, bs)
        return m
    }, [
        arrays.balanceSheets,
    ])

    const incomeStatementById = useMemo(() => {
        const m = new Map<string, YearData["incomeStatements"][number]>()
        for (const is of arrays.incomeStatements) m.set(is.id, is)
        return m
    }, [
        arrays.incomeStatements,
    ])

    const matchingById = useMemo(() => {
        const m = new Map<string, YearData["matchings"][number]>()
        for (const matching of arrays.matchings) m.set(matching.id, matching)
        return m
    }, [
        arrays.matchings,
    ])

    const computationById = useMemo(() => {
        const m = new Map<string, YearData["computations"][number]>()
        for (const c of arrays.computations) m.set(c.id, c)
        return m
    }, [
        arrays.computations,
    ])

    const maps: YearDataMaps = useMemo(
        () => ({
            entryById,
            entryLinesByEntryId,
            entryTagsByEntryId,
            journalById,
            tagById,
            fileById,
            folderById,
            accountById,
            accountByNumber,
            balanceSheetById,
            incomeStatementById,
            matchingById,
            computationById,
        }),
        [
            entryById,
            entryLinesByEntryId,
            entryTagsByEntryId,
            journalById,
            tagById,
            fileById,
            folderById,
            accountById,
            accountByNumber,
            balanceSheetById,
            incomeStatementById,
            matchingById,
            computationById,
        ],
    )

    if (isPending) {
        return (
            <CircularLoader
                text="Chargement des données..."
                className={{
                    padding: "1rem",
                }}
            />
        )
    }

    if (isError) {
        return (
            <FormatError
                text="Erreur lors de la récupération des données."
                className={{
                    padding: "1rem",
                }}
            />
        )
    }

    return props.children({
        ...(arrays as unknown as Pick<YearData, K[number]>),
        ...maps,
    })
}
