import {
    deleteOneComputationIncomeStatementRouteDefinition,
    readAllComputationIncomeStatementsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../../../../../../routes/applicationRouter.tsx"
import { getResponseBodyFromAPI } from "../../../../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../../../../utilities/invalidateData.ts"

export function DeleteOneComputationIncomeStatement(props: {
    computationIncomeStatement: v.InferOutput<typeof returnedSchemas.computationIncomeStatement>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const deleteResponse = await getResponseBodyFromAPI({
            routeDefinition: deleteOneComputationIncomeStatementRouteDefinition,
            body: {
                idComputationIncomeStatement: props.computationIncomeStatement.id,
                idYear: props.computationIncomeStatement.idYear,
            },
        })

        if (deleteResponse.ok === false) {
            toast({
                title: "Erreur lors de la suppression de la ligne de compte de résultat",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllComputationIncomeStatementsRouteDefinition,
            body: {
                idYear: props.computationIncomeStatement.idYear,
            },
        })

        toast({
            title: "Ligne de compte de résultat supprimée",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
            params: {
                idOrganization: props.computationIncomeStatement.idOrganization,
                idYear: props.computationIncomeStatement.idYear,
            },
        })
    }

    return (
        <Button
            onClick={() =>
                openModal(
                    modalId,
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Voulez-vous supprimer cette ligne de compte de résultat ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                Cette action supprimera la ligne de compte de résultat et toutes les données associées.
                                Cette action est irréversible.
                            </Dialog.Description>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button onClick={() => closeModal(modalId)}>
                                <ButtonOutlineContent text="Annuler" />
                            </Button>
                            <Button
                                hasLoader
                                onClick={async () => {
                                    await onSubmit()
                                    closeModal(modalId)
                                }}
                            >
                                <ButtonPlainContent
                                    color="danger"
                                    text="Supprimer la ligne de compte de résultat"
                                />
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>,
                )
            }
        >
            {props.children}
        </Button>
    )
}
