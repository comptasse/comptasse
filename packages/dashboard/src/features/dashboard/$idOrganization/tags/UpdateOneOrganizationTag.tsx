import {
    readAllOrganizationTagsRouteDefinition,
    updateOneTagRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, toast } from "@comptasse/ui"
import { IconPencil } from "@tabler/icons-react"
import { Fragment, type JSX } from "react"
import type * as v from "valibot"
import { FormCheckboxListField } from "../../../../components/forms/FormCheckboxListField.tsx"
import { FormRoot } from "../../../../components/forms/FormRoot.tsx"
import { FormTextField } from "../../../../components/forms/FormTextField.tsx"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../utilities/invalidateData.ts"

type Year = v.InferOutput<typeof returnedSchemas.year>
type OrganizationTag = v.InferOutput<typeof readAllOrganizationTagsRouteDefinition.schemas.return>[number]

export function UpdateOneOrganizationTag(props: { tag: OrganizationTag; years: Array<Year>; children: JSX.Element }) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={updateOneTagRouteDefinition.schemas.body}
            defaultValues={{
                idTag: props.tag.id,
                label: props.tag.label,
                idYearIds: props.tag.idYearIds,
            }}
            submitButtonProps={{
                leftIcon: <IconPencil />,
                text: "Modifier la catégorie",
            }}
            onSubmit={async (data) => {
                const response = await getResponseBodyFromAPI({
                    routeDefinition: updateOneTagRouteDefinition,
                    body: {
                        idTag: data.idTag,
                        label: data.label,
                        idYearIds: data.idYearIds ?? [],
                    },
                })
                if (response.ok === false) {
                    toast({
                        title: "Impossible de modifier la catégorie",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Catégorie modifiée avec succès",
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
            onClick={() => openPanel(form, "Modifier la catégorie")}
        >
            {props.children}
        </Button>
    )
}
