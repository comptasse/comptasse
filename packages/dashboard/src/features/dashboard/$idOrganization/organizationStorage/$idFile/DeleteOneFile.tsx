import { readAllFilesRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, Dialog, toast, useModalStore } from "@comptasse/ui"
import { type ComponentPropsWithRef, type ReactElement, useId } from "react"
import type * as v from "valibot"
import { applicationRouter } from "../../../../../routes/applicationRouter.tsx"
import { invalidateData } from "../../../../../utilities/invalidateData.ts"
import { deleteFile } from "../deleteFile.ts"

export function DeleteOneFile(props: {
    file: v.InferOutput<typeof returnedSchemas.file>
    children: ReactElement<ComponentPropsWithRef<"div">>
}) {
    const modalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function onSubmit() {
        const isDeleted = await deleteFile({
            idFile: props.file.id,
        })

        if (isDeleted === false) {
            toast({
                title: "Erreur lors de la suppression du fichier",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllFilesRouteDefinition,
            body: {},
        })

        toast({
            title: "Fichier supprimé",
            variant: "success",
        })

        applicationRouter.navigate({
            to: "/organisation/$idOrganization/stockage",
            params: {
                idOrganization: props.file.idOrganization,
            },
            search: {
                idFolder: undefined,
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
                            <Dialog.Title>Voulez-vous supprimer ce fichier ?</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Dialog.Description>
                                Cette action supprimera le fichier et toutes les données associées. Cette action est
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
                                    text="Supprimer le fichier"
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
