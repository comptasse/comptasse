import {
    readAllAccountsRouteDefinition,
    readOneAccountRouteDefinition,
    updateOneAccountRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputText, InputToggle, toast } from "@comptasse/ui"
import { IconPlus } from "@tabler/icons-react"
import type { JSX } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../utilities/invalidateData.ts"
import { BalanceSheetsSelect } from "../../balanceSheets/BalanceSheetsSelect.tsx"
import { AccountSelect } from "../AccountSelect.tsx"

export function UpdateOneAccount(props: {
    account: v.InferOutput<typeof returnedSchemas.account>
    children: JSX.Element
}) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={updateOneAccountRouteDefinition.schemas.body}
            defaultValues={{
                ...props.account,
                idAccount: props.account.id,
            }}
            submitButtonProps={{
                leftIcon: <IconPlus />,
                text: "Modifier le compte",
            }}
            onSubmit={async (data) => {
                const updateAccountResponse = await getResponseBodyFromAPI({
                    routeDefinition: updateOneAccountRouteDefinition,
                    body: data,
                })
                if (updateAccountResponse.ok === false) {
                    toast({
                        title: "Impossible de modifier le compte",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Compte modifié avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readAllAccountsRouteDefinition,
                        body: {
                            idYear: props.account.idYear,
                        },
                    }),
                    invalidateData({
                        routeDefinition: readOneAccountRouteDefinition,
                        body: {
                            idAccount: props.account.id,
                            idYear: props.account.idYear,
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
                                        idOrganization={props.account.idOrganization}
                                        idYear={props.account.idYear}
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
                                        idOrganization={props.account.idOrganization}
                                        idYear={props.account.idYear}
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
                                        idOrganization={props.account.idOrganization}
                                        idYear={props.account.idYear}
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
            onClick={() => openPanel(form, "Modifier le compte")}
        >
            {props.children}
        </Button>
    )
}
