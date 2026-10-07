import { createOneAccountRouteDefinition, readAllAccountsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputText, InputToggle, toast } from "@comptasse/ui"
import { IconPlus } from "@tabler/icons-react"
import type { JSX } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../utilities/invalidateData.ts"
import { BalanceSheetsSelect } from "../balanceSheets/BalanceSheetsSelect.tsx"
import { AccountSelect } from "./AccountSelect.tsx"

export function CreateOneAccount(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    children: JSX.Element
}) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={createOneAccountRouteDefinition.schemas.body}
            defaultValues={{
                idYear: props.idYear,
                isSelectable: true,
                type: "balance-sheet",
            }}
            submitButtonProps={{
                leftIcon: <IconPlus />,
                text: "Ajouter le compte",
            }}
            onSubmit={async (data) => {
                const createAccountResponse = await getResponseBodyFromAPI({
                    routeDefinition: createOneAccountRouteDefinition,
                    body: data,
                })
                if (createAccountResponse.ok === false) {
                    toast({
                        title: "Impossible d'ajouter le compte",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Compte ajouté avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await invalidateData({
                    routeDefinition: readAllAccountsRouteDefinition,
                    body: {
                        idYear: props.idYear,
                    },
                })

                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Numéro"
                                    tooltip="Le numéro qui définit le compte ajouté."
                                    isRequired
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Libellé"
                                    tooltip="Le libellé qui définit le compte ajouté."
                                    isRequired
                                />
                                <FormControl>
                                    <InputText
                                        value={field.value}
                                        onChange={field.onChange}
                                        autoFocus
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idAccountParent"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Compte parent"
                                    tooltip="Le compte parent du compte créé."
                                />
                                <FormControl>
                                    <AccountSelect
                                        idOrganization={props.idOrganization}
                                        idYear={props.idYear}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="isSelectable"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Sélectionnable ?"
                                    tooltip="Le compte est sélectionnable pour les écritures."
                                />
                                <FormControl>
                                    <InputToggle
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            {
                                                label: "Oui",
                                                value: true,
                                            },
                                            {
                                                label: "Non",
                                                value: false,
                                            },
                                        ]}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel label="Type de compte" />
                                <FormControl>
                                    <InputToggle
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            {
                                                label: "Compte de bilan",
                                                value: "balance-sheet",
                                            },
                                            {
                                                label: "Compte de gestion",
                                                value: "income-statement",
                                            },
                                            {
                                                label: "Compte spécial",
                                                value: "special",
                                            },
                                        ]}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idBalanceSheetAsset"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Ligne de bilan associée (actif)"
                                    tooltip="La ligne de bilan associée (actif) au compte créé."
                                />
                                <FormControl>
                                    <BalanceSheetsSelect
                                        idOrganization={props.idOrganization}
                                        idYear={props.idYear}
                                        value={field.value}
                                        onChange={field.onChange}
                                        side="asset"
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="balanceSheetAssetColumn"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Colonne de ligne de bilan associée (actif)"
                                    tooltip="Colonne de la ligne de bilan associée (actif) au compte créé."
                                />
                                <FormControl>
                                    <InputToggle
                                        value={field.value}
                                        onChange={field.onChange}
                                        options={[
                                            {
                                                label: "Brut",
                                                value: "gross",
                                            },
                                            {
                                                label: "Amort. & Dépré.",
                                                value: "amortization",
                                            },
                                        ]}
                                    />
                                </FormControl>
                                <FormError />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="idBalanceSheetLiability"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Ligne de bilan associée (passif)"
                                    tooltip="La ligne de bilan associée (passif) au compte créé."
                                />
                                <FormControl>
                                    <BalanceSheetsSelect
                                        idOrganization={props.idOrganization}
                                        idYear={props.idYear}
                                        value={field.value}
                                        onChange={field.onChange}
                                        side="liability"
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

    return (
        <Button
            className={{
                padding: "0",
                border: "none",
                backgroundColor: "transparent",
                width: "fit-content",
                height: "fit-content",
            }}
            onClick={() => openPanel(form, "Ajouter un compte")}
        >
            {props.children}
        </Button>
    )
}
