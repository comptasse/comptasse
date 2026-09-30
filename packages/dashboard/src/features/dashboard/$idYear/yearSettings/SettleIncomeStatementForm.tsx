import {
    readAllAccountsRouteDefinition,
    readAllEntriesRouteDefinition,
    readAllEntryLinesRouteDefinition,
    settleIncomeStatementRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { toast } from "@comptasse/ui"
import { IconReportMoney } from "@tabler/icons-react"
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
 * Solds the income-statement accounts and books the year result on 120/129.
 * The generated lines are excluded from both reports (only the 120/129 result
 * line appears, in the balance sheet). Idempotent: the API replaces the
 * previously generated closing entry (matched by idempotency key).
 */
export function SettleIncomeStatementForm(props: { year: v.InferOutput<typeof returnedSchemas.year> }) {
    const { closePanel } = useRightPanel()

    return (
        <FormRoot
            schema={schema}
            defaultValues={{
                idJournalClosing: "",
            }}
            submitButtonProps={{
                leftIcon: <IconReportMoney />,
                text: "Solder les comptes de gestion",
            }}
            onSubmit={async (data) => {
                const accountsResponse = await getResponseBodyFromAPI({
                    routeDefinition: readAllAccountsRouteDefinition,
                    body: {
                        idYear: props.year.id,
                    },
                    params: {
                        idOrganization: props.year.idOrganization,
                    },
                })
                if (accountsResponse.ok === false) {
                    toast({
                        title: "Impossible de charger le plan comptable",
                        variant: "error",
                    })
                    return false
                }

                const idAccountProfit = accountsResponse.data.find((account) => account.number === "120")?.id
                const idAccountLoss = accountsResponse.data.find((account) => account.number === "129")?.id
                if (idAccountProfit === undefined || idAccountLoss === undefined) {
                    toast({
                        title: "Comptes 120 / 129 introuvables dans cet exercice",
                        variant: "error",
                    })
                    return false
                }

                const response = await getResponseBodyFromAPI({
                    routeDefinition: settleIncomeStatementRouteDefinition,
                    body: {
                        idYear: props.year.id,
                        idJournalClosing: data.idJournalClosing,
                        idAccountProfit,
                        idAccountLoss,
                    },
                    params: {
                        idOrganization: props.year.idOrganization,
                    },
                })
                if (response.ok === false) {
                    toast({
                        title: "Impossible de solder les comptes de gestion",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Comptes de gestion soldés",
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
                                    description="Journal dans lequel l'écriture de clôture des comptes de gestion est enregistrée."
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
