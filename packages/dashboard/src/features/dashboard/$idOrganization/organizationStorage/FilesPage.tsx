import {
    readAllFilesRouteDefinition,
    readAllFoldersRouteDefinition,
    updateOneFileRouteDefinition,
} from "@comptasse/application-metadata/routes"
import { Button, ButtonOutlineContent, ButtonPlainContent, toast } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconPlus, IconSettings } from "@tabler/icons-react"
import { useNavigate, useParams, useSearch } from "@tanstack/react-router"
import { type DragEvent, useState } from "react"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.js"
import { Page } from "../../../../components/layouts/page/page.js"

import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { CreateOneFile } from "./CreateOneFile.js"
import { CreateOneFolder } from "./CreateOneFolder.js"
import { FilesPageContent } from "./FilesPageContent.js"

export function FilesPage() {
    const params = useParams({
        strict: false,
    }) as {
        idOrganization: string
    }
    const { idFolder } = useSearch({
        strict: false,
    }) as {
        idFolder?: string
    }
    const navigate = useNavigate()

    // Current folder is derived from the URL search param
    const currentFolderId = idFolder ?? null

    function navigateToFolder(folderId: string | null) {
        navigate({
            to: ".",
            search: folderId
                ? {
                      idFolder: folderId,
                  }
                : {},
        })
    }

    // Breadcrumb drag-and-drop - move files to a specific breadcrumb folder (or root)
    const [breadcrumbDragOver, setBreadcrumbDragOver] = useState<string | null>(null)

    function handleBreadcrumbDragOver(event: DragEvent, targetId: string) {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
        setBreadcrumbDragOver(targetId)
    }

    function handleBreadcrumbDragLeave() {
        setBreadcrumbDragOver(null)
    }

    async function handleBreadcrumbDrop(event: DragEvent, targetFolderId: string | null) {
        event.preventDefault()
        setBreadcrumbDragOver(null)

        const fileId = event.dataTransfer.getData("text/plain")
        if (!fileId) return

        const updateResponse = await getResponseBodyFromAPI({
            routeDefinition: updateOneFileRouteDefinition,
            body: {
                idFile: fileId,
                idFolder: targetFolderId,
            },
        })

        if (updateResponse.ok === false) {
            toast({
                title: "Impossible de déplacer le fichier",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllFilesRouteDefinition,
            body: {},
        })

        toast({
            title: "Fichier déplacé",
            variant: "success",
        })
    }

    return (
        <Page.Root>
            <Page.Content>
                {/* View toggle + actions */}
                <div
                    className={css({
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: "0.5rem",
                    })}
                >
                    <CreateOneFolder
                        idOrganization={params.idOrganization}
                        idFolderParent={currentFolderId}
                    />
                    <CreateOneFile
                        idOrganization={params.idOrganization}
                        idFolder={currentFolderId}
                    >
                        <ButtonPlainContent
                            leftIcon={<IconPlus />}
                            text="Ajouter un fichier"
                        />
                    </CreateOneFile>
                    <div
                        className={css({
                            marginLeft: "auto",
                        })}
                    >
                        <Button
                            onClick={() =>
                                navigate({
                                    to: "/organisation/$idOrganization/paramètres",
                                    params: {
                                        idOrganization: params.idOrganization,
                                    },
                                })
                            }
                        >
                            <ButtonOutlineContent
                                leftIcon={<IconSettings />}
                                text="Paramètres"
                            />
                        </Button>
                    </div>
                </div>

                <DataWrapper
                    routeDefinition={readAllFoldersRouteDefinition}
                    body={{}}
                >
                    {(folders) => (
                        <FilesPageContent
                            folders={folders}
                            idFolder={idFolder}
                            currentFolderId={currentFolderId}
                            navigateToFolder={navigateToFolder}
                            breadcrumbDragOver={breadcrumbDragOver}
                            handleBreadcrumbDragOver={handleBreadcrumbDragOver}
                            handleBreadcrumbDragLeave={handleBreadcrumbDragLeave}
                            handleBreadcrumbDrop={handleBreadcrumbDrop}
                            params={params}
                        />
                    )}
                </DataWrapper>
            </Page.Content>
        </Page.Root>
    )
}
