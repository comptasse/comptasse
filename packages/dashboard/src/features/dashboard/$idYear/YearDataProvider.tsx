import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { type ReactNode, useMemo } from "react"
import { ClientError } from "../../../utilities/clientError.ts"
import { getResponseBodyFromAPI } from "../../../utilities/getResponseBodyFromAPI.ts"
import { buildQueryKey } from "../../../utilities/queryKey.ts"
import {
    type YearData,
    YearDataContext,
    type YearDataContextValue,
    type YearDataKey,
    type YearScopedRouteDefinition,
    yearQueries,
} from "./YearDataContext.js"

function useYearQuery<K extends YearDataKey>(
    key: K,
    body: {
        idYear: string
    },
) {
    const routeDefinition = yearQueries[key] as YearScopedRouteDefinition

    return useQuery({
        queryKey: buildQueryKey(routeDefinition, body as Record<string, unknown>),
        queryFn: async (context) => {
            const response = await getResponseBodyFromAPI({
                routeDefinition,
                body,
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
    }) as UseQueryResult<YearData[K]>
}

export function YearDataProvider(props: { idYear: string; children: ReactNode }) {
    const body = useMemo(
        () => ({
            idYear: props.idYear,
        }),
        [
            props.idYear,
        ],
    )

    const accounts = useYearQuery("accounts", body)
    const entries = useYearQuery("entries", body)
    const entryLines = useYearQuery("entryLines", body)
    const entryTags = useYearQuery("entryTags", body)
    const journals = useYearQuery("journals", body)
    const matchings = useYearQuery("matchings", body)
    const tags = useYearQuery("tags", body)
    const files = useYearQuery("files", body)
    const folders = useYearQuery("folders", body)
    const balanceSheets = useYearQuery("balanceSheets", body)
    const incomeStatements = useYearQuery("incomeStatements", body)
    const computations = useYearQuery("computations", body)
    const computationIncomeStatements = useYearQuery("computationIncomeStatements", body)

    const value = useMemo<YearDataContextValue>(
        () => ({
            accounts,
            entries,
            entryLines,
            entryTags,
            journals,
            matchings,
            tags,
            files,
            folders,
            balanceSheets,
            incomeStatements,
            computations,
            computationIncomeStatements,
        }),
        [
            accounts,
            entries,
            entryLines,
            entryTags,
            journals,
            matchings,
            tags,
            files,
            folders,
            balanceSheets,
            incomeStatements,
            computations,
            computationIncomeStatements,
        ],
    )

    return <YearDataContext.Provider value={value}>{props.children}</YearDataContext.Provider>
}
