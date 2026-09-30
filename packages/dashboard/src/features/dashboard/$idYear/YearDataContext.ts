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
import type { UseQueryResult } from "@tanstack/react-query"
import { createContext } from "react"
import type * as v from "valibot"

export const yearQueries = {
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

export type YearQueries = typeof yearQueries

export type YearData = {
    [K in keyof YearQueries]: v.InferOutput<YearQueries[K]["schemas"]["return"]>
}

export type YearDataKey = keyof YearData

export type YearDataContextValue = {
    [K in YearDataKey]: UseQueryResult<YearData[K]>
}

export type YearScopedRouteDefinition = {
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

export const YearDataContext = createContext<YearDataContextValue | null>(null)
