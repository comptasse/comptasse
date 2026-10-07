import type { routeDefinition } from "@comptasse/application-metadata/utilities"
import { InputCombobox } from "@comptasse/ui"
import type * as v from "valibot"
import { useDataFromAPI } from "../utilities/useHTTPData.js"

export function InputDataCombobox<TRouteDefinition extends ReturnType<typeof routeDefinition>>(props: {
    routeDefinition: TRouteDefinition
    body: v.InferInput<TRouteDefinition["schemas"]["body"]>
    placeholder?: string
    getOption: (data: v.InferOutput<TRouteDefinition["schemas"]["return"]>[number]) => {
        key: string
        label: string
    }
    /** Restrict the offered options (e.g. only selectable accounts). */
    filter?: (data: v.InferOutput<TRouteDefinition["schemas"]["return"]>[number]) => boolean
    /** Allow long option/trigger labels to wrap onto multiple lines. */
    wrapLabels?: boolean
    value?: string | null
    onChange: (value?: string | null) => void
}) {
    const response = useDataFromAPI({
        routeDefinition: props.routeDefinition,
        body: props.body,
    })

    const items: Array<v.InferOutput<TRouteDefinition["schemas"]["return"]>[number]> =
        response.data === undefined
            ? []
            : Array.isArray(response.data)
              ? response.data
              : [
                    response.data,
                ]
    const filteredItems = props.filter === undefined ? items : items.filter(props.filter)

    return (
        <InputCombobox
            key={response.status}
            value={props.value}
            onChange={props.onChange}
            isLoading={response.isPending}
            allowEmpty={true}
            wrapLabels={props.wrapLabels}
            placeholder={props.placeholder ?? "Sélectionner un élément"}
            options={filteredItems.map((item) => props.getOption(item))}
        />
    )
}
