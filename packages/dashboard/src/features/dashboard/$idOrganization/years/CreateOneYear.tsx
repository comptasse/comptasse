import { createOneYearRouteDefinition, readAllYearsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputDate, InputText, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus } from "@tabler/icons-react"
import type { ComponentProps, JSX } from "react"
import { useState } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../components/forms/FormRoot.tsx"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"
import { YearSelect } from "./YearSelect.tsx"

export function CreateOneYear(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    children: JSX.Element
    className?: ComponentProps<typeof Button>["className"]
    onClick?: () => void
}) {
    const [open, setOpen] = useState(false)
    const currentDate = new Date()

    return (
        <>
            <Button
                className={css.raw(
                    {
                        padding: "0",
                        border: "none",
                        backgroundColor: "transparent",
                        width: "fit-content",
                        height: "fit-content",
                    },
                    props.className,
                )}
                onClick={() => {
                    props.onClick?.()
                    setOpen(true)
                }}
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
                        schema={createOneYearRouteDefinition.schemas.body}
                        defaultValues={{
                            startingAt: new Date(currentDate.getFullYear(), 0, 1).toISOString(),
                            endingAt: new Date(currentDate.getFullYear(), 11, 31).toISOString(),
                            label: undefined,
                        }}
                        submitButtonProps={{
                            leftIcon: <IconPlus />,
                            text: "Ajouter l'exercice",
                        }}
                        onSubmit={async (data) => {
                            const response = await getResponseBodyFromAPI({
                                routeDefinition: createOneYearRouteDefinition,
                                body: data,
                            })
                            if (!response.ok) {
                                toast({
                                    title: "Impossible de créer l'exercice",
                                    variant: "error",
                                })
                                return false
                            }

                            toast({
                                title: "Exercice créé avec succès",
                                variant: "success",
                            })
                            return true
                        }}
                        onCancel={undefined}
                        onSuccess={async () => {
                            await invalidateData({
                                routeDefinition: readAllYearsRouteDefinition,
                                body: {},
                                params: {
                                    idOrganization: props.idOrganization,
                                },
                            })

                            setOpen(false)
                        }}
                    >
                        {(form) => (
                            <Fragment>
                                <FormField
                                    control={form.control}
                                    name="startingAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                label="Date de début"
                                                isRequired={true}
                                                description={undefined}
                                                tooltip={undefined}
                                            />
                                            <FormControl>
                                                <InputDate
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
                                    name="endingAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                label="Date de fin"
                                                isRequired={true}
                                                description={undefined}
                                                tooltip={undefined}
                                            />
                                            <FormControl>
                                                <InputDate
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
                                    name="idYearPrevious"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel
                                                label="Exercice précédent ?"
                                                isRequired={false}
                                                description={undefined}
                                                tooltip={undefined}
                                            />
                                            <FormControl>
                                                <YearSelect
                                                    idOrganization={props.idOrganization}
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
                                                label="Libellé de l'exercice"
                                                isRequired={false}
                                                description={undefined}
                                                tooltip={undefined}
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
