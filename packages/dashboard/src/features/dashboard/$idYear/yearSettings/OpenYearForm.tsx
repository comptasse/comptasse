import {
    openYearRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { toast } from "@comptasse/ui"
import { IconArrowBarToRight } from "@tabler/icons-react"
import { Fragment } from "react/jsx-runtime"
import * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"
import { JournalSelect } from "./journals/JournalSelect.tsx"

const schema = v.object({
    idJournalOpening: v.pipe(v.string(), v.nonEmpty("Le journal d'à-nouveaux doit être renseigné")),
})

/**
 * Carries the previous year's balance-sheet balances into this year (à-nouveaux).
 * Requires the previous year to be open and its income statement to be settled.
 * Idempotent: the API replaces the previously generated opening entry (matched
 * by idempotency key).
 */
export function OpenYearForm(props: { year: v.InferOutput<typeof returnedSchemas.year> }) {
    const { closePanel } = useRightPanel()

    return (
        <FormRoot
            schema={schema}
            defaultValues={{
                idJournalOpening: "",
            }}
            submitButtonProps={{
                leftIcon: <IconArrowBarToRight />,
                text: "Générer les à-nouveaux",
            }}
            onSubmit={async (data) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: openYearRouteDefinition,
                    body: {
                        idYear: props.year.id,
                        idJournalOpening: data.idJournalOpening,
                    },
                    params: {
                        idOrganization: props.year.idOrganization,
                    },
                })
                if (response.ok === false) {
                    toast({
                        title: "Impossible de générer les à-nouveaux",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "À-nouveaux générés",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readAllEntriesRouteDefinition,
                        body: {
                            idYear: props.year.id,
                        },
                        params: {
                            idOrganization: props.year.idOrganization,
                        },
                    }),
                    invalidateData({
                        routeDefinition: readAllEntryLinesRouteDefinition,
                        body: {
                            idYear: props.year.id,
                        },
                        params: {
                            idOrganization: props.year.idOrganization,
                        },
                    }),
                ])

                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="idJournalOpening"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Journal d'à-nouveaux"
                                    isRequired={true}
                                    description="Journal dans lequel l'écriture de report est enregistrée (ex. AN - À-nouveaux)."
                                    tooltip={undefined}
                                />
                                <FormControl>
                                    <JournalSelect
                                        idOrganization={props.year.idOrganization}
                                        idYear={props.year.id}
                                        value={field.value === "" ? null : field.value}
                                        onChange={(value) => field.onChange(value ?? "")}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                </Fragment>
            )}
        </FormRoot>
    )
}
