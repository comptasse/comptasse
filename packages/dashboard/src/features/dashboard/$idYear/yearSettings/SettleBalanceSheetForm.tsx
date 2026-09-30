import {
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    settleBalanceSheetRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { toast } from "@comptasse/ui"
import { IconScale } from "@tabler/icons-react"
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
    idJournalClosing: v.pipe(v.string(), v.nonEmpty("Le journal de clôture doit être renseigné")),
})

/**
 * Solds the balance-sheet accounts. The generated lines are excluded from the
 * balance-sheet report (they only zero the ledger balances), so the report stays
 * untouched. Idempotent: the API replaces the previously generated closing
 * entry (matched by idempotency key).
 */
export function SettleBalanceSheetForm(props: { year: v.InferOutput<typeof returnedSchemas.year> }) {
    const { closePanel } = useRightPanel()

    return (
        <FormRoot
            schema={schema}
            defaultValues={{
                idJournalClosing: "",
            }}
            submitButtonProps={{
                leftIcon: <IconScale />,
                text: "Solder les comptes de bilan",
            }}
            onSubmit={async (data) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: settleBalanceSheetRouteDefinition,
                    body: {
                        idYear: props.year.id,
                        idJournalClosing: data.idJournalClosing,
                    },
                    params: {
                        idOrganization: props.year.idOrganization,
                    },
                })
                if (response.ok === false) {
                    toast({
                        title: "Impossible de solder les comptes de bilan",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Comptes de bilan soldés",
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
                        name="idJournalClosing"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Journal de clôture"
                                    isRequired={true}
                                    description="Journal dans lequel l'écriture de clôture des comptes de bilan est enregistrée."
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
