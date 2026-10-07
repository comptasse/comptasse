import { readAllFilesRouteDefinition, type readAllFoldersRouteDefinition } from "@comptasse/application-metadata/routes"
import { InputCheckbox } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { type DragEvent, useMemo, useState } from "react"
import type * as v from "valibot"
import { DataWrapper } from "../../../../components/layouts/DataWrapper.js"
import { FilesGrid } from "./FilesGrid.js"
import { FilesTable } from "./FilesTable.js"

type ViewMode = "grid" | "list"

type Folder = v.InferOutput<typeof readAllFoldersRouteDefinition.schemas.return>[number]

/**
 * Build the breadcrumb path from the root to the target folder by
 * walking `idFolderParent` links upward, then reversing.
 */
function buildFolderPath(
    folders: Array<Folder>,
    targetId: string | undefined,
): Array<{
    id: string
    name: string
}> {
    if (!targetId) return []

    const map = new Map(
        folders.map((f) => [
            f.id,
            f,
        ]),
    )
    const path: Array<{
        id: string
        name: string
    }> = []
    let current = map.get(targetId)

    while (current) {
        path.push({
            id: current.id,
            name: current.name,
        })
        current = current.idFolderParent ? map.get(current.idFolderParent) : undefined
    }

    return path.reverse()
}

/**
 * Inner component that has access to the fetched folders data,
 * allowing us to compute the breadcrumb path.
 */
export function FilesPageContent(props: {
    folders: Array<Folder>
    idFolder: string | undefined
    currentFolderId: string | null
    navigateToFolder: (folderId: string | null) => void
    breadcrumbDragOver: string | null
    handleBreadcrumbDragOver: (event: DragEvent, targetId: string) => void
    handleBreadcrumbDragLeave: () => void
    handleBreadcrumbDrop: (event: DragEvent, targetFolderId: string | null) => void
    params: {
        idOrganization: string
    }
}) {
    const {
        folders,
        idFolder,
        currentFolderId,
        navigateToFolder,
        breadcrumbDragOver: _breadcrumbDragOver,
        handleBreadcrumbDragOver: _handleBreadcrumbDragOver,
        handleBreadcrumbDragLeave: _handleBreadcrumbDragLeave,
        handleBreadcrumbDrop: _handleBreadcrumbDrop,
        params,
    } = props
    const [viewMode, _setViewMode] = useState<ViewMode>("list")
    const [showOcrFiles, setShowOcrFiles] = useState(false)

    const _folderPath = useMemo(
        () => buildFolderPath(folders, idFolder),
        [
            folders,
            idFolder,
        ],
    )

    const currentFolders = folders.filter((f) => (f.idFolderParent ?? null) === currentFolderId)

    // Compute the parent folder ID so that ".." navigation works
    const parentFolderId = useMemo(() => {
        if (!currentFolderId) return null
        const currentFolder = folders.find((f) => f.id === currentFolderId)
        return currentFolder?.idFolderParent ?? null
    }, [
        folders,
        currentFolderId,
    ])

    const sortedFolders = useMemo(
        () =>
            [
                ...currentFolders,
            ].sort((a, b) => a.name.localeCompare(b.name)),
        [
            currentFolders,
        ],
    )

    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                justifyContent: "start",
                alignItems: "start",
                gap: "0.5rem",
            })}
        >
            <DataWrapper
                routeDefinition={readAllFilesRouteDefinition}
                body={{}}
            >
                {(files) => {
                    // OCR-generated files (markdown) are hidden by default: they are
                    // linked to their source file, which shows them in its "Texte OCR" tab.
                    const currentFiles = files
                        .filter((f) => (f.idFolder ?? null) === currentFolderId)
                        .filter((f) => showOcrFiles || f.idFileParent === null)

                    return (
                        <div
                            className={css({
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.5rem",
                            })}
                        >
                            <div
                                className={css({
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    fontSize: "sm",
                                    color: "neutral/60",
                                })}
                            >
                                <InputCheckbox
                                    checked={showOcrFiles}
                                    onChange={(checked) => setShowOcrFiles(checked)}
                                />
                                Afficher les fichiers OCR
                            </div>
                            {viewMode === "grid" ? (
                                <FilesGrid
                                    idOrganization={params.idOrganization}
                                    files={currentFiles}
                                    folders={sortedFolders}
                                    currentFolderId={currentFolderId}
                                    parentFolderId={parentFolderId}
                                    onFolderOpen={navigateToFolder}
                                />
                            ) : (
                                <FilesTable
                                    idOrganization={params.idOrganization}
                                    files={currentFiles}
                                    folders={sortedFolders}
                                    currentFolderId={currentFolderId}
                                    parentFolderId={parentFolderId}
                                    onFolderOpen={navigateToFolder}
                                />
                            )}
                        </div>
                    )
                }}
            </DataWrapper>
        </div>
    )
}
