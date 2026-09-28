import { readAllFilesRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonOutlineContent, ButtonPlainContent, toast, useModalStore } from "@comptasse/ui"
import { IconArrowsMove, IconEye, IconFileText, IconPencil, IconTrash } from "@tabler/icons-react"
import { type ReactElement, useId } from "react"
import type * as v from "valibot"
import { ContextMenu } from "../../../../components/overlays/contextMenu/contextMenu.js"
import { Dialog } from "../../../../components/overlays/dialog/dialog.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { applicationRouter } from "../../../../routes/applicationRouter.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { UpdateOneFileForm } from "./$idFile/UpdateOneFileForm.js"
import { deleteFile } from "./deleteFile.js"
import { MoveOneFileForm } from "./MoveOneFileForm.js"

export function FileContextMenu(props: {
    file: v.InferOutput<typeof returnedSchemas.file>
    idOrganization: string
    children: ReactElement
}) {
    const { openPanel } = useRightPanel()
    const deleteModalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function handleDelete() {
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
    }

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>{props.children}</ContextMenu.Trigger>
            <ContextMenu.Content>
                <ContextMenu.Item
                    leftIcon={<IconEye />}
                    onSelect={() => {
                        applicationRouter.navigate({
                            to: "/organisation/$idOrganization/fichier/$idFile",
                            params: {
                                idOrganization: props.idOrganization,
                                idFile: props.file.id,
                            },
                        })
                    }}
                >
                    Ouvrir
                </ContextMenu.Item>
                <ContextMenu.Item
                    leftIcon={<IconPencil />}
                    onSelect={() =>
                        openPanel(
                            <UpdateOneFileForm
                                file={props.file}
                                mode="metadata"
                            />,
                            "Modifier les métadonnées",
                        )
                    }
                >
                    Modifier les métadonnées
                </ContextMenu.Item>
                <ContextMenu.Item
                    leftIcon={<IconFileText />}
                    onSelect={() =>
                        openPanel(
                            <UpdateOneFileForm
                                file={props.file}
                                mode="file"
                            />,
                            "Remplacer le fichier",
                        )
                    }
                >
                    Remplacer le fichier
                </ContextMenu.Item>
                <ContextMenu.Item
                    leftIcon={<IconArrowsMove />}
                    onSelect={() => openPanel(<MoveOneFileForm file={props.file} />, "Déplacer le fichier")}
                >
                    Déplacer
                </ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item
                    leftIcon={<IconTrash />}
                    color="danger"
                    onSelect={() =>
                        openModal(
                            deleteModalId,
                            <Dialog.Content>
                                <Dialog.Header>
                                    <Dialog.Title>Voulez-vous supprimer ce fichier ?</Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <Dialog.Description>
                                        Cette action supprimera le fichier et toutes les données associées. Cette action
                                        est irréversible.
                                    </Dialog.Description>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Button onClick={() => closeModal(deleteModalId)}>
                                        <ButtonOutlineContent text="Annuler" />
                                    </Button>
                                    <Button
                                        hasLoader
                                        onClick={async () => {
                                            await handleDelete()
                                            closeModal(deleteModalId)
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
                    Supprimer
                </ContextMenu.Item>
            </ContextMenu.Content>
        </ContextMenu.Root>
    )
}
