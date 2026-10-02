import {
    createOneOrganizationTagRouteDefinition,
    readAllOrganizationTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, InputCheckbox, InputText, toast } from "@comptasse/ui"
import { IconPlus } from "@tabler/icons-react"
import { Fragment, type JSX } from "react"
import type * as v from "valibot"
import { FormControl } from "../../../../components/forms/FormControl.tsx"
import { FormError } from "../../../../components/forms/FormError.tsx"
import { FormField } from "../../../../components/forms/FormField.tsx"
import { FormItem } from "../../../../components/forms/FormItem.tsx"
import { FormLabel } from "../../../../components/forms/FormLabel.tsx"
import { FormRoot } from "../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

type Year = v.InferOutput<typeof returnedSchemas.year>

export function CreateOneOrganizationTag(props: { years: Array<Year>; children: JSX.Element }) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={createOneOrganizationTagRouteDefinition.schemas.body}
            defaultValues={{
                label: "",
                idYearIds: [],
            }}
            submitButtonProps={{
                leftIcon: <IconPlus />,
                text: "Ajouter la catégorie",
            }}
            onSubmit={async (data) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: createOneOrganizationTagRouteDefinition,
                    body: {
                        label: data.label,
                        idYearIds: data.idYearIds ?? [],
                    },
                })
                if (response.ok === false) {
                    toast({
                        title: "Impossible de créer la catégorie",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Catégorie créée avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await invalidateData({
                    routeDefinition: readAllOrganizationTagsRouteDefinition,
                    body: {},
                })

                closePanel()
            }}
        >
            {(form) => (
                <Fragment>
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel
                                    label="Libellé"
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
                        name="idYearIds"
                        render={({ field }) => {
                            const selected = (field.value ?? []) as Array<string>
                            return (
                                <FormItem>
                                    <FormLabel
                                        label="Exercices"
                                        isRequired={false}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "0.375rem",
                                        }}
                                    >
                                        {props.years.map((year) => (
                                            <div
                                                key={year.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <InputCheckbox
                                                    checked={selected.includes(year.id)}
                                                    onChange={(checked) =>
                                                        field.onChange(
                                                            checked
                                                                ? [
                                                                      ...selected,
                                                                      year.id,
                                                                  ]
                                                                : selected.filter((id) => id !== year.id),
                                                        )
                                                    }
                                                />
                                                {year.label ?? year.id}
                                            </div>
                                        ))}
                                    </div>
                                    <FormError />
                                </FormItem>
                            )
                        }}
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
            onClick={() => openPanel(form, "Ajouter une catégorie")}
        >
            {props.children}
        </Button>
    )
}
