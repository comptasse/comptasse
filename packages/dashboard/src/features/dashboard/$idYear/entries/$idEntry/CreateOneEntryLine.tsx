import {
    createOneEntryLineRouteDefinition,
    readAllEntryLinesRouteDefinition,
    readOneEntryRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, toast } from "@comptasse/ui"
import { IconPlus } from "@tabler/icons-react"
import { type JSX } from "react"
import type * as v from "valibot"
import { FormRoot } from "../../../../../components/forms/FormRoot.tsx"
import { useRightPanel } from "../../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../utilities/invalidateData.ts"
import { EntryLineFormFields } from "./$idEntryLine/EntryLineFormFields.tsx"

export function CreateOneEntryLine(props: {
    entry: v.InferOutput<typeof returnedSchemas.entry>
    children: JSX.Element
}) {
    const { openPanel, closePanel } = useRightPanel()

    const form = (
        <FormRoot
            schema={createOneEntryLineRouteDefinition.schemas.body}
            defaultValues={{
                idYear: props.entry.idYear,
                idEntry: props.entry.id,
                isComputedForJournalReport: true,
                isComputedForLedgerReport: true,
                isComputedForBalanceReport: true,
                isComputedForBalanceSheetReport: true,
                isComputedForIncomeStatementReport: true,
            }}
            submitButtonProps={{
                leftIcon: <IconPlus />,
                text: "Ajouter le mouvement",
            }}
            onSubmit={async (data) => {
                const createEntryLineResponse = await getResponseBodyFromAPI({
                    routeDefinition: createOneEntryLineRouteDefinition,
                    body: data,
                })
                if (createEntryLineResponse.ok === false) {
                    toast({
                        title: "Impossible d'ajouter le mouvement",
                        variant: "error",
                    })
                    return false
                }

                toast({
                    title: "Mouvement ajouté avec succès",
                    variant: "success",
                })
                return true
            }}
            onCancel={undefined}
            onSuccess={async () => {
                await Promise.all([
                    invalidateData({
                        routeDefinition: readOneEntryRouteDefinition,
                        body: {
                            idYear: props.entry.idYear,
                            idEntry: props.entry.id,
                        },
                    }),
                    invalidateData({
                        routeDefinition: readAllEntryLinesRouteDefinition,
                        body: {
                            idYear: props.entry.idYear,
                        },
                    }),
                ])

                closePanel()
            }}
        >
            {(form) => <EntryLineFormFields form={form} idYear={props.entry.idYear} />}
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
            onClick={() => openPanel(form, "Ajouter un mouvement")}
        >
            {props.children}
        </Button>
    )
}
