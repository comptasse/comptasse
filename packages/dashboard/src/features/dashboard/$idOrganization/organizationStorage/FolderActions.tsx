import { deleteOneFolderRouteDefinition, readAllFoldersRouteDefinition } from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import {
    Button,
    ButtonGhostContent,
    ButtonOutlineContent,
    ButtonPlainContent,
    Separator,
    toast,
    useModalStore,
} from "@comptasse/ui"
import { IconArrowsMove, IconDotsVertical, IconEye, IconPencil, IconTrash } from "@tabler/icons-react"
import { useId } from "react"
import type * as v from "valibot"
import { Dialog } from "../../../../components/overlays/dialog/dialog.js"
import { Popover } from "../../../../components/overlays/popover/popover.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { MoveOneFolderForm } from "./MoveOneFolderForm.js"
import { UpdateOneFolderForm } from "./UpdateOneFolderForm.js"

export function FolderActions(props: {
    folder: v.InferOutput<typeof returnedSchemas.folder>
    idOrganization: string
    onFolderOpen: (folderId: string | null) => void
}) {
    const { openPanel } = useRightPanel()
    const deleteModalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()

    async function handleDelete() {
        const deleteResponse = await getResponseBodyFromAPI({
            routeDefinition: deleteOneFolderRouteDefinition,
            body: {
                idFolder: props.folder.id,
            },
        })

        if (deleteResponse.ok === false) {
            toast({
                title: "Erreur lors de la suppression du dossier",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllFoldersRouteDefinition,
            body: {},
        })

        toast({
            title: "Dossier supprimé",
            variant: "success",
        })
    }

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button>
                    <ButtonGhostContent
                        leftIcon={<IconDotsVertical />}
                        text={undefined}
                    />
                </Button>
            </Popover.Trigger>
            <Popover.Content
                align="end"
                className={{
                    padding: "0.5rem",
                    gap: "0.25rem",
                }}
            >
                <Popover.Close asChild>
                    <Button
                        className={{
                            width: "100%",
                        }}
                        onClick={() => props.onFolderOpen(props.folder.id)}
                    >
                        <ButtonGhostContent
                            leftIcon={<IconEye />}
                            text="Ouvrir"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                        />
                    </Button>
                </Popover.Close>
                <Popover.Close asChild>
                    <Button
                        className={{
                            width: "100%",
                        }}
                        onClick={() => openPanel(<UpdateOneFolderForm folder={props.folder} />, "Renommer le dossier")}
                    >
                        <ButtonGhostContent
                            leftIcon={<IconPencil />}
                            text="Renommer"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                        />
                    </Button>
                </Popover.Close>
                <Popover.Close asChild>
                    <Button
                        className={{
                            width: "100%",
                        }}
                        onClick={() => openPanel(<MoveOneFolderForm folder={props.folder} />, "Déplacer le dossier")}
                    >
                        <ButtonGhostContent
                            leftIcon={<IconArrowsMove />}
                            text="Déplacer"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                        />
                    </Button>
                </Popover.Close>
                <Separator />
                <Popover.Close asChild>
                    <Button
                        className={{
                            width: "100%",
                        }}
                        onClick={() =>
                            openModal(
                                deleteModalId,
                                <Dialog.Content>
                                    <Dialog.Header>
                                        <Dialog.Title>Voulez-vous supprimer ce dossier ?</Dialog.Title>
                                    </Dialog.Header>
                                    <Dialog.Body>
                                        <Dialog.Description>
                                            Cette action supprimera le dossier et tous ses sous-dossiers. Les fichiers
                                            contenus ne seront pas supprimés. Cette action est irréversible.
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
                                                text="Supprimer le dossier"
                                            />
                                        </Button>
                                    </Dialog.Footer>
                                </Dialog.Content>,
                            )
                        }
                    >
                        <ButtonGhostContent
                            leftIcon={<IconTrash />}
                            text="Supprimer"
                            color="danger"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                        />
                    </Button>
                </Popover.Close>
            </Popover.Content>
        </Popover.Root>
    )
}
