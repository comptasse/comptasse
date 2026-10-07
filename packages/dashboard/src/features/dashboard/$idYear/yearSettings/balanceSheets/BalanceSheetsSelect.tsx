import { readAllBalanceSheetsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { InputCombobox } from "@comptasse/ui"
import type * as v from "valibot"
import { useDataFromAPI } from "../../../../../utilities/useHTTPData.ts"

export function BalanceSheetsSelect(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    value?: string | null
    onChange: (value?: string | null) => void
    side: "asset" | "liability" | null
}) {
    const balanceSheetsResponse = useDataFromAPI({
        routeDefinition: readAllBalanceSheetsRouteDefinition,
        body: {
            idYear: props.idYear,
        },
    })

    return (
        <InputCombobox
            value={props.value}
            onChange={props.onChange}
            isLoading={balanceSheetsResponse.isPending}
            allowEmpty={true}
            placeholder="Sélectionner une ligne de bilan"
            options={(() => {
                const options: Array<{
                    key: string
                    label: string
                }> = []
                if (balanceSheetsResponse.data !== undefined) {
                    for (const balanceSheet of balanceSheetsResponse.data) {
                        if (props.side !== undefined && balanceSheet.side !== props.side) continue
                        options.push({
                            key: balanceSheet.id,
                            label: `${balanceSheet.number} ${balanceSheet.label}`,
                        })
                    }
                }
                return options
            })()}
        />
    )
}
