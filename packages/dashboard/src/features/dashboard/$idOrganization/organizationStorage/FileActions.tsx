import { ocrFileRouteDefinition, readAllFilesRouteDefinition } from "@comptasse/application-metadata/routes"
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
import { IconArrowsMove, IconDotsVertical, IconEye, IconFileText, IconPencil, IconTrash } from "@tabler/icons-react"
import { useRouter } from "@tanstack/react-router"
import { useId, useState } from "react"
import type * as v from "valibot"
import { Dialog } from "../../../../components/overlays/dialog/dialog.js"
import { Popover } from "../../../../components/overlays/popover/popover.js"
import { useRightPanel } from "../../../../contexts/rightPanel/RightPanelContext.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { UpdateOneFileForm } from "./$idFile/UpdateOneFileForm.js"
import { deleteFile } from "./deleteFile.js"
import { MoveOneFileForm } from "./MoveOneFileForm.js"

export function FileActions(props: { file: v.InferOutput<typeof returnedSchemas.file>; idOrganization: string }) {
    const { openPanel } = useRightPanel()
    const deleteModalId = useId()
    const { open: openModal, close: closeModal } = useModalStore()
    const [ocrLoading, setOcrLoading] = useState(false)
    const router = useRouter()

    const isOcrSupportedType = props.file.type === "application/pdf" || (props.file.type?.startsWith("image/") ?? false)

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

    async function handleOcr() {
        setOcrLoading(true)
        try {
            const ocrResponse = await getResponseBodyFromAPI({
                routeDefinition: ocrFileRouteDefinition,
                body: {
                    idFile: props.file.id,
                },
                hasToastMessage: true,
            })

            if (ocrResponse.ok === false) {
                return
            }

            await invalidateData({
                routeDefinition: readAllFilesRouteDefinition,
                body: {},
            })

            toast({
                title: "Fichier converti en Markdown",
                variant: "success",
            })
        } finally {
            setOcrLoading(false)
        }
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
                        onClick={() =>
                            router.navigate({
                                to: "/organisation/$idOrganization/fichier/$idFile",
                                params: {
                                    idOrganization: props.idOrganization,
                                    idFile: props.file.id,
                                },
                            })
                        }
                        className={{
                            width: "100%",
                        }}
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
                        onClick={() =>
                            openPanel(
                                <UpdateOneFileForm
                                    file={props.file}
                                    mode="metadata"
                                />,
                                "Modifier les métadonnées",
                            )
                        }
                    >
                        <ButtonGhostContent
                            leftIcon={<IconPencil />}
                            text="Modifier les métadonnées"
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
                        onClick={() =>
                            openPanel(
                                <UpdateOneFileForm
                                    file={props.file}
                                    mode="file"
                                />,
                                "Remplacer le fichier",
                            )
                        }
                    >
                        <ButtonGhostContent
                            leftIcon={<IconFileText />}
                            text="Remplacer le fichier"
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
                        onClick={() => openPanel(<MoveOneFileForm file={props.file} />, "Déplacer le fichier")}
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
                {props.file.storageKey && isOcrSupportedType && (
                    <Popover.Close asChild>
                        <Button
                            className={{
                                width: "100%",
                            }}
                            onClick={!ocrLoading ? handleOcr : undefined}
                            isDisabled={ocrLoading}
                        >
                            <ButtonGhostContent
                                leftIcon={<IconFileText />}
                                text={ocrLoading ? "Extraction..." : "Extraire le texte (OCR)"}
                                className={{
                                    width: "100%",
                                    justifyContent: "start",
                                }}
                            />
                        </Button>
                    </Popover.Close>
                )}
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
                                        <Dialog.Title>Voulez-vous supprimer ce fichier ?</Dialog.Title>
                                    </Dialog.Header>
                                    <Dialog.Body>
                                        <Dialog.Description>
                                            Cette action supprimera le fichier et toutes les données associées. Cette
                                            action est irréversible.
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
