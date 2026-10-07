import {
    readAllComputationsRouteDefinition,
    readOneComputationRouteDefinition,
    updateOneComputationRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import type { JSX } from "react"
import { useState } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../../../../components/forms/FormRoot.tsx"
import { getResponseBodyFromAPI } from "../../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../../utilities/invalidateData.ts"

export function UpdateOneComputation(props: {
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
                        schema={updateOneComputationRouteDefinition.schemas.body}
                        defaultValues={{
                            ...props.computation,
                            idComputation: props.computation.id,
                        }}
                        submitButtonProps={{
                            leftIcon: <IconPlus />,
                            text: "Modifier la ligne de calcul",
                        }}
                        onSubmit={async (data) => {
                            const updateComputationResponse = await getResponseBodyFromAPI({
                                routeDefinition: updateOneComputationRouteDefinition,
                                body: data,
                            })
                            if (updateComputationResponse.ok === false) {
                                toast({
                                    title: "Impossible de modifier la ligne de calcul",
                                    variant: "error",
                                })
                                return false
                            }

                            toast({
                                title: "Ligne de calcul modifiée avec succès",
                                variant: "success",
                            })
                            return true
                        }}
                        onCancel={undefined}
                        onSuccess={async () => {
                            await Promise.all([
                                invalidateData({
                                    routeDefinition: readAllComputationsRouteDefinition,
                                    body: {
                                        idYear: props.computation.idYear,
                                    },
                                }),
                                invalidateData({
                                    routeDefinition: readOneComputationRouteDefinition,
                                    body: {
                                        idComputation: props.computation.id,
                                        idYear: props.computation.idYear,
                                    },
                                }),
                            ])

                            setOpen(false)
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
                                                tooltip="Le numéro qui définit la ligne de calcul ajoutée."
                                                isRequired={true}
                                            />
                                            <FormControl>
                                                <InputText
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    autoFocus={true}
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
                                                tooltip="Le libellé qui définit la ligne de calcul ajoutée."
                                                isRequired={true}
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
                            </Fragment>
                        )}
                    </FormRoot>
                </div>
            )}
        </>
    )
}
