import { readAllAccountsRouteDefinition } from "@comptasse/application-metadata/routes"
import { InputPrice, InputToggle } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { Fragment } from "react/jsx-runtime"
import type { UseFormReturn } from "react-hook-form"
import { FormControl } from "../../../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../../../components/forms/FormLabel.tsx"
import { InputDataCombobox } from "../../../../../../components/InputDataCombobox.tsx"

const COMPUTED_TOGGLES: Array<{
    name: string
    label: string
}> = [
    {
        name: "isComputedForJournalReport",
        label: "Journal",
    },
    {
        name: "isComputedForLedgerReport",
        label: "Grand-livre",
    },
    {
        name: "isComputedForBalanceReport",
        label: "Balance",
    },
    {
        name: "isComputedForBalanceSheetReport",
        label: "Bilan",
    },
    {
        name: "isComputedForIncomeStatementReport",
        label: "Compte de résultat",
    },
]

export function EntryLineFormFields({ form, idYear }: { form: UseFormReturn<any>; idYear: string }) {
    return (
        <Fragment>
            <FormField
                control={form.control}
                name="idAccount"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel
                            label="Compte"
                            isRequired={true}
                        />
                        <FormControl>
                            <InputDataCombobox
                                value={field.value}
                                onChange={field.onChange}
                                routeDefinition={readAllAccountsRouteDefinition}
                                body={{
                                    idYear: idYear,
                                }}
                                placeholder="Sélectionner un compte"
                                getOption={(journal) => ({
                                    key: journal.id,
                                    label: `${journal.number} - ${journal.label}`,
                                })}
                            />
                        </FormControl>
                        <FormError />
                    </FormItem>
                )}
            />
            <div
                className={css({
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "1",
                })}
            >
                <FormField
                    control={form.control}
                    name="debit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel
                                label="Débit"
                                isRequired={false}
                            />
                            <FormControl>
                                <InputPrice
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
                    name="credit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel
                                label="Crédit"
                                isRequired={false}
                            />
                            <FormControl>
                                <InputPrice
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormError />
                        </FormItem>
                    )}
                />
            </div>
            <div
                className={css({
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                })}
            >
                <FormLabel
                    label="Mouvement ajouté aux calculs ?"
                    isRequired={false}
                />
                <div
                    className={css({
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                    })}
                >
                    {COMPUTED_TOGGLES.map((toggle) => (
                        <FormField
                            key={toggle.name}
                            control={form.control}
                            name={toggle.name}
                            render={({ field }) => (
                                <FormItem
                                    className={{
                                        width: "fit-content",
                                    }}
                                >
                                    <FormLabel
                                        label={toggle.label}
                                        isRequired={true}
                                    />
                                    <FormControl>
                                        <InputToggle
                                            value={field.value}
                                            onChange={field.onChange}
                                            options={[
                                                {
                                                    value: true,
                                                    label: "Oui",
                                                },
                                                {
                                                    value: false,
                                                    label: "Non",
                                                },
                                            ]}
                                        />
                                    </FormControl>
                                    <FormError />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
            </div>
        </Fragment>
    )
}
