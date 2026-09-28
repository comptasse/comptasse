import {
    deleteOneBalanceSheetRouteDefinition,
    readAllBalanceSheetsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../../../routes/applicationRouter.tsx"
import { getResponseBodyFromAPI } from "../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../utilities/invalidateData.ts"

export function DeleteOneBalanceSheet(props: {
    balanceSheet: v.InferOutput<typeof returnedSchemas.balanceSheet>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const deleteResponse = await getResponseBodyFromAPI({
            routeDefinition: deleteOneBalanceSheetRouteDefinition,
            body: {
                idBalanceSheet: props.balanceSheet.id,
                idYear: props.balanceSheet.idYear,
            },
        })

        if (deleteResponse.ok === false) {
            toast({
                title: "Erreur lors de la suppression de la ligne de bilan",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllBalanceSheetsRouteDefinition,
            body: {
                idYear: props.balanceSheet.idYear,
            },
        })

        toast({
            title: "Ligne de bilan supprimée",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/exercice/$idYear/bilan",
            params: {
                idOrganization: props.balanceSheet.idOrganization,
                idYear: props.balanceSheet.idYear,
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
                            <Dialog.Title>Voulez-vous supprimer cette ligne de bilan ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                Cette action supprimera la ligne de bilan et toutes les données associées. Cette action
                                est irréversible.
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
                                    text="Supprimer la ligne de bilan"
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
