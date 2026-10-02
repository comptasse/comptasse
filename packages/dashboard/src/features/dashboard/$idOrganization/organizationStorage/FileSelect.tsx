import { readAllFilesRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { InputCombobox } from "@comptasse/ui"
import type * as v from "valibot"
import { useDataFromAPI } from "../../../../utilities/useHTTPData.ts"

export function FileSelect(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    value?: string | null
    onChange: (value?: string | null) => void
}) {
    const filesResponse = useDataFromAPI({
        routeDefinition: readAllFilesRouteDefinition,
        body: {
            idYear: props.idYear,
        },
    })

    return (
        <InputCombobox
            value={props.value}
            onChange={props.onChange}
            isLoading={filesResponse.isPending}
            allowEmpty={true}
            placeholder="Sélectionner une pièce justificative"
            options={
                filesResponse.data === undefined
                    ? []
                    : filesResponse.data.map((file) => ({
                          key: file.id,
                          label:
                              file.reference && file.reference !== file.name
                                  ? `${file.name} (${file.reference})`
                                  : file.name,
                      }))
            }
        />
    )
}
