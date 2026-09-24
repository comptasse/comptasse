import {
    readAllAccountsRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readOneEntryLineRouteDefinition,
    updateOneEntryLineRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, toast } from "@comptasse/ui"
import { IconPencil } from "@tabler/icons-react"
import { type JSX } from "react"
import type * as v from "valibot"
import { FormRoot } from "../../../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../utilities/invalidateData.ts"
import { EntryLineFormFields } from "./EntryLineFormFields.tsx"

export function UpdateOneEntryLine(props: {
    entryLine: v.InferOutput<typeof returnedSchemas.entryLine>
    children: JSX.Element
}) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={updateOneEntryLineRouteDefinition.schemas.body}
            defaultValues={{
                ...props.entryLine,
                idEntryLine: props.entryLine.id,
            }}
            submitButtonProps={{
                leftIcon: <IconPencil />,
                text: "Modifier le mouvement",
            }}
            onSubmit={async (data) => {
                const updateEntryLineResponse = await getResponseBodyFromAPI({
                    routeDefinition: updateOneEntryLineRouteDefinition,
                    body: data,
                })
                if (updateEntryLineResponse.ok === false) {
                    toast({
                        title: "Impossible de modifier le mouvement",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Mouvement modifié avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={() => closePanel()}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readAllEntryLinesRouteDefinition,
                        body: {
                            idYear: props.entryLine.idYear,
                        },
                    }),
                    invalidateData({
                        routeDefinition: readOneEntryLineRouteDefinition,
                        body: {
                            idYear: props.entryLine.idYear,
                            idEntryLine: props.entryLine.id,
                        },
                    }),
                ])

                closePanel()
            }}
        >
            {(form) => <EntryLineFormFields form={form} idYear={props.entryLine.idYear} />}
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
            onClick={() => openPanel(form, "Modifier le mouvement")}
        >
            {props.children}
        </Button>
    )
}
