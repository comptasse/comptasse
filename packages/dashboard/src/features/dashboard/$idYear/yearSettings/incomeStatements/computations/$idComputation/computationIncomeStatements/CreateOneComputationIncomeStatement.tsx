import {
    createOneComputationIncomeStatementRouteDefinition,
    readAllComputationIncomeStatementsRouteDefinition,
    readAllIncomeStatementsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputToggle, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import { type JSX, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../../../../../components/forms/FormRoot.tsx"
import { InputDataCombobox } from "../../../../../../../../components/InputDataCombobox.tsx"
import { getResponseBodyFromAPI } from "../../../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../../../utilities/invalidateData.ts"

export function CreateOneComputationIncomeStatement(props: {
    computation: v.InferOutput<typeof returnedSchemas.computation>
    children: JSX.Element
}) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button
                className={{
                    padding: "0",
                    border: "none",
                    backgroundColor: "transparent",
                    width: "fit-content",
                    height: "fit-content",
                }}
                onClick={() => setOpen(true)}
            >
                {props.children}
            </Button>
            {open && (
                <div
                    className={css({
                        padding: "2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                    })}
                >
                    <FormRoot
                        schema={createOneComputationIncomeStatementRouteDefinition.schemas.body}
                        defaultValues={{
                            idYear: props.computation.idYear,
                            operation: "plus",
                        }}
                        submitButtonProps={{
                            leftIcon: <IconPlus />,
                            text: "Ajouter le terme du calcul",
                        }}
                        onSubmit={async (data) => {
                            const createComputationIncomeStatementResponse = await getResponseBodyFromAPI({
                                routeDefinition: createOneComputationIncomeStatementRouteDefinition,
                                body: data,
                            })
                            if (createComputationIncomeStatementResponse.ok === false) {
                                toast({
                                    title: "Impossible d'ajouter le terme du calcul",
                                    variant: "error",
                                })
                                return false
                            }

                            toast({
                                title: "Terme du calcul ajouté avec succès",
                                variant: "success",
                            })
                            return true
                        }}
                        onCancel={() => setOpen(false)}
                        onSuccess={async () => {
                            await invalidateData({
                                routeDefinition: readAllComputationIncomeStatementsRouteDefinition,
                                body: {
                                    idYear: props.computation.idYear,
                                },
                            })

                            setOpen(false)
                        }}
                    >
                        {(form) => (
                            <Fragment>
                                <FormField
                                    control={form.control}
                                    name="idIncomeStatement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                label="Poste du compte de résultat"
                                                tooltip="Le poste du compte de résultat à utiliser pour cette opération."
                                                isRequired
                                            />
                                            <FormControl>
                                                <InputDataCombobox
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    routeDefinition={readAllIncomeStatementsRouteDefinition}
                                                    body={{
                                                        idYear: props.computation.idYear,
                                                    }}
                                                    placeholder="Sélectionner un poste du compte de résultat"
                                                    getOption={(incomeStatement) => ({
                                                        key: incomeStatement.id,
                                                        label: `${incomeStatement.number} - ${incomeStatement.label}`,
                                                    })}
                                                />
                                            </FormControl>
                                            <FormError />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="operation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                label="Opération"
                                                tooltip="L'opération à effectuer avec cette ligne de compte de résultat."
                                                isRequired
                                            />
                                            <FormControl>
                                                <InputToggle
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    options={[
                                                        {
                                                            label: "Addition",
                                                            value: "plus",
                                                        },
                                                        {
                                                            label: "Soustraction",
                                                            value: "minus",
                                                        },
                                                    ]}
                                                />
                                            </FormControl>
                                            <FormError />
                                        </FormItem>
                                    )}
                                />
                            </Fragment>
                        )}
                    </FormRoot>
                </div>
            )}
        </>
    )
}
