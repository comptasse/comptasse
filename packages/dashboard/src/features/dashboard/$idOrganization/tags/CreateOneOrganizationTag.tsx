import {
    createOneOrganizationTagRouteDefinition,
    readAllOrganizationTagsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, toast } from "@comptasse/ui"
import { IconPlus } from "@tabler/icons-react"
import { Fragment, type JSX } from "react"
import type * as v from "valibot"
import { FormCheckboxListField } from "../../../../components/forms/FormCheckboxListField.tsx"
import { FormRoot } from "../../../../components/forms/FormRoot.tsx"
import { FormTextField } from "../../../../components/forms/FormTextField.tsx"
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
                    <FormTextField
                        control={form.control}
                        name="label"
                        label="Libellé"
                        isRequired={true}
                        autoFocus={true}
                    />
                    <FormCheckboxListField
                        control={form.control}
                        name="idYearIds"
                        label="Exercices"
                        options={props.years.map((year) => ({
                            key: year.id,
                            label: year.label ?? year.id,
                        }))}
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
