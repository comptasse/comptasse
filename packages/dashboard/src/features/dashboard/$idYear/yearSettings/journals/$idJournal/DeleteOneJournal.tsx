import { deleteOneJournalRouteDefinition, readAllJournalsRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../../../routes/applicationRouter.tsx"
import { getResponseBodyFromAPI } from "../../../../../../utilities/getResponseBodyFromAPI.ts"
import { invalidateData } from "../../../../../../utilities/invalidateData.ts"

export function DeleteOneJournal(props: {
    journal: v.InferOutput<typeof returnedSchemas.journal>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const deleteResponse = await getResponseBodyFromAPI({
            routeDefinition: deleteOneJournalRouteDefinition,
            body: {
                idJournal: props.journal.id,
                idYear: props.journal.idYear,
            },
        })

        if (deleteResponse.ok === false) {
            toast({
                title: "Erreur lors de la suppression du journal",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllJournalsRouteDefinition,
            body: {
                idYear: props.journal.idYear,
            },
        })

        toast({
            title: "Journal supprimé",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/exercice/$idYear/journaux",
            params: {
                idOrganization: props.journal.idOrganization,
                idYear: props.journal.idYear,
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
                            <Dialog.Title>Voulez-vous supprimer ce journal ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                Cette action supprimera le journal et toutes les données associées. Cette action est
                                irréversible.
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
                                    text="Supprimer le journal"
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
