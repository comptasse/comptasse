import {
    deleteOneComputationRouteDefinition,
    readAllComputationsRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../../../../routes/applicationRouter.tsx"
import { getResponseBodyFromAPI } from "../../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../../utilities/invalidateData.ts"

export function DeleteOneComputation(props: {
    computation: v.InferOutput<typeof returnedSchemas.computation>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const deleteResponse = await getResponseBodyFromAPI({
            routeDefinition: deleteOneComputationRouteDefinition,
            body: {
                idComputation: props.computation.id,
                idYear: props.computation.idYear,
            },
        })

        if (deleteResponse.ok === false) {
            toast({
                title: "Erreur lors de la suppression de la ligne de calcul",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllComputationsRouteDefinition,
            body: {
                idYear: props.computation.idYear,
            },
        })

        toast({
            title: "Ligne de calcul supprimée",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat",
            params: {
                idOrganization: props.computation.idOrganization,
                idYear: props.computation.idYear,
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
                            <Dialog.Title>Voulez-vous supprimer cette ligne de calcul ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                Cette action supprimera la ligne de calcul et toutes les données associées. Cette action
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
                                    text="Supprimer la ligne de calcul"
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
