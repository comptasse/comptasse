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
    readAllTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type * as v from "valibot"
import { dataClient } from "../contexts/data/queryClient.js"
import { getResponseBodyFromAPI } from "./getResponseBodyFromAPI.js"
import { buildQueryKey } from "./queryKey.js"

type YearScopedBody = {
    idYear: string
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

const yearScopedRouteDefinitions: YearScopedRouteDefinition[] = [
    readAllAccountsRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readAllEntryTagsRouteDefinition,
    readAllJournalsRouteDefinition,
    readAllTagsRouteDefinition,
    readAllFilesRouteDefinition,
    readAllFoldersRouteDefinition,
    readAllBalanceSheetsRouteDefinition,
    readAllIncomeStatementsRouteDefinition,
    readAllComputationsRouteDefinition,
    readAllComputationIncomeStatementsRouteDefinition,
]

/**
 * Prefetches all year-scoped data into the React Query cache.
 *
 * Called when entering a year layout. Each query is set to `staleTime: Infinity`
 * so it is only refetched on explicit invalidation (after mutations) or hard refresh.
 *
 * This is fire-and-forget - it does not block navigation.
 */
export function prefetchYearData(params: { idYear: string; idOrganization: string }) {
    const body: YearScopedBody = {
        idYear: params.idYear,
    }
    const routeParams = {
        idOrganization: params.idOrganization,
    }

    for (const routeDefinition of yearScopedRouteDefinitions) {
        dataClient.setQueryDefaults(
            [
                routeDefinition.path,
            ],
            {
                staleTime: Number.POSITIVE_INFINITY,
            },
        )

        dataClient.prefetchQuery({
            queryKey: buildQueryKey(routeDefinition, body as Record<string, unknown>, routeParams),
            queryFn: async ({ signal }) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition,
                    body,
                    params: routeParams,
                    signal,
                })
                if (response.ok === false) {
                    throw response.error
                }
                return response.data
            },
        })
    }
}
