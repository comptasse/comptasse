import {
    readAllFilesRouteDefinition,
    readAllFoldersRouteDefinition,
    updateOneFileRouteDefinition,
    updateOneFolderRouteDefinition,
} from "@comptasse/application-metadata/routes"
import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { Button, ButtonGhostContent, FormatDateTime, FormatFileSize, FormatNull, toast } from "@comptasse/ui"
import { cn, css } from "@comptasse/ui/utilities/cn.js"
import { IconArrowLeft, IconFile, IconFileTypePdf, IconFolder } from "@tabler/icons-react"
import type { ColumnDef } from "@tanstack/react-table"
import {
    type DragEvent,
    type MouseEvent,
    type MutableRefObject,
    memo,
    type ReactElement,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import type * as v from "valibot"
import { DataTable } from "../../../../components/layouts/dataTable/DataTable.js"
import { applicationRouter } from "../../../../routes/applicationRouter.js"
import { getResponseBodyFromAPI } from "../../../../utilities/getResponseBodyFromAPI.js"
import { invalidateData } from "../../../../utilities/invalidateData.js"
import { FileActions } from "./FileActions.js"
import type { TableRow } from "./FilesTableSelectionActions.js"
import { FilesTableSelectionActions } from "./FilesTableSelectionActions.js"
import { FolderActions } from "./FolderActions.js"

type DragPayload =
    | {
          kind: "file"
          id: string
          sourceFolderId: string | null
      }
    | {
          kind: "folder"
          id: string
          sourceParentFolderId: string | null
      }

const FILE_ICONS: Record<string, ReactElement> = {
    "application/pdf": <IconFileTypePdf />,
}

function getDragPayload(event: DragEvent): DragPayload | null {
    try {
        const rawPayload = event.dataTransfer.getData("text/plain")
        if (!rawPayload) return null
        const payload = JSON.parse(rawPayload) as DragPayload
        if (payload.kind !== "file" && payload.kind !== "folder") return null
        if (!payload.id) return null
        return payload
    } catch {
        return null
    }
}

function canDropOnTarget(parameters: { payload: DragPayload; targetFolderId: string | null }) {
    if (parameters.payload.kind === "file") {
        return parameters.payload.sourceFolderId !== parameters.targetFolderId
    }

    if (parameters.targetFolderId === parameters.payload.id) return false
    return parameters.payload.sourceParentFolderId !== parameters.targetFolderId
}

function buildFileTableColumns(parameters: {
    idOrganization: string
    parentFolderId: string | null
    onFolderOpen: (folderId: string | null) => void
    suppressClickRef: MutableRefObject<boolean>
}): Array<ColumnDef<TableRow>> {
    return [
        {
            id: "name",
            accessorFn: (row) => (row.kind === "back" ? ".." : (row.data.name ?? "")),
            header: "Nom",
            cell: ({ row }) => {
                const item = row.original
                if (item.kind === "back") {
                    return (
                        <button
                            type="button"
                            aria-label="Remonter au dossier parent"
                            onClick={() => parameters.onFolderOpen(parameters.parentFolderId)}
                            className={css({
                                width: "fit-content",
                                maxWidth: "100%",
                                cursor: "pointer",
                                border: 0,
                                backgroundColor: "transparent",
                                padding: 0,
                            })}
                        >
                            <ButtonGhostContent
                                leftIcon={<IconArrowLeft />}
                                text=".."
                            />
                        </button>
                    )
                }
                if (item.kind === "folder") {
                    return (
                        <div
                            className={css({
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                                minWidth: "0",
                            })}
                        >
                            <Button
                                onClick={(event) => {
                                    if (parameters.suppressClickRef.current) {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        return
                                    }
                                    parameters.onFolderOpen(item.data.id)
                                }}
                                title={item.data.name}
                                className={{
                                    flex: "1",
                                    minWidth: "0",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                }}
                            >
                                <ButtonGhostContent
                                    leftIcon={<IconFolder />}
                                    text={item.data.name}
                                />
                            </Button>
                        </div>
                    )
                }
                if (item.kind === "file") {
                    const leftIcon = item.data.type !== null ? FILE_ICONS[item.data.type] : undefined

                    return (
                        <div
                            className={css({
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                                minWidth: "0",
                            })}
                        >
                            <Button
                                onClick={(event) => {
                                    if (parameters.suppressClickRef.current) {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        return
                                    }
                                    applicationRouter.navigate({
                                        to: "/organisation/$idOrganization/fichier/$idFile",
                                        params: {
                                            idOrganization: parameters.idOrganization,
                                            idFile: item.data.id,
                                        },
                                    })
                                }}
                                title={item.data.name ?? "/"}
                                className={{
                                    flex: "1",
                                    minWidth: "0",
                                    overflow: "hidden",
                                    cursor: "pointer",
                                }}
                            >
                                <ButtonGhostContent
                                    leftIcon={leftIcon ?? <IconFile />}
                                    text={item.data.name ?? "/"}
                                />
                            </Button>
                        </div>
                    )
                }
            },
            filterFn: "includesString",
        },
        {
            id: "size",
            accessorFn: (row) => (row.kind === "file" ? (row.data.size ?? "") : ""),
            header: "Size",
            cell: ({ row }) => {
                const item = row.original
                if (item.kind === "back" || item.kind === "folder") return <FormatNull />
                if (item.kind === "file") return <FormatFileSize size={item.data.size} />
            },
            filterFn: "includesString",
        },
        {
            id: "createdAt",
            accessorFn: (row) => (row.kind === "back" ? "" : row.data.createdAt),
            header: "Date",
            cell: ({ row }) => {
                const item = row.original
                if (item.kind === "back")
                    return (
                        <span
                            className={css({
                                color: "neutral/40",
                            })}
                        >
                            --
                        </span>
                    )
                if (item.kind === "folder") return <FormatDateTime date={item.data.createdAt} />
                return <FormatDateTime date={item.data.createdAt} />
            },
            filterFn: "includesString",
        },
        {
            id: "actions",
            header: " ",
            cell: ({ row }) => {
                const item = row.original
                if (item.kind === "back") return null
                if (item.kind === "folder") {
                    return (
                        <FolderActions
                            folder={item.data}
                            idOrganization={parameters.idOrganization}
                            onFolderOpen={parameters.onFolderOpen}
                        />
                    )
                }
                return (
                    <FileActions
                        file={item.data}
                        idOrganization={parameters.idOrganization}
                    />
                )
            },
            enableSorting: false,
            enableGlobalFilter: false,
        },
    ]
}

type RowInteractionContext = {
    parentFolderId: string | null
    dragOverTargetId: string | null
    draggingPayload: DragPayload | null
    longPressReadyId: string | null
    setDragOverTargetId: (id: string | null) => void
    handleDrop: (event: DragEvent, targetFolderId: string | null) => void
    startLongPress: (event: MouseEvent<HTMLTableRowElement>, payload: DragPayload, id: string) => void
    cancelLongPress: () => void
    handleRowDragStart: (event: DragEvent<HTMLTableRowElement>) => void
    handleDragEnd: () => void
}

function buildRowInteractionProps(item: TableRow, context: RowInteractionContext) {
    const dropTargetProps = (() => {
        if (item.kind === "file") return {}
        const targetId = item.kind === "back" ? "back" : item.data.id
        const targetFolderId = item.kind === "back" ? context.parentFolderId : item.data.id
        return {
            onDragOver: (event: DragEvent<HTMLTableRowElement>) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                context.setDragOverTargetId(targetId)
            },
            onDragLeave: (event: DragEvent<HTMLTableRowElement>) => {
                if ((event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) return
                context.setDragOverTargetId(null)
            },
            onDrop: (event: DragEvent<HTMLTableRowElement>) => context.handleDrop(event, targetFolderId),
        }
    })()

    const dragSourceProps = (() => {
        if (item.kind === "back") return {}
        const id = item.kind === "folder" ? item.data.id : item.data.id
        const payload: DragPayload =
            item.kind === "folder"
                ? {
                      kind: "folder",
                      id: item.data.id,
                      sourceParentFolderId: item.data.idFolderParent ?? null,
                  }
                : {
                      kind: "file",
                      id: item.data.id,
                      sourceFolderId: item.data.idFolder ?? null,
                  }
        return {
            onMouseDown: (event: MouseEvent<HTMLTableRowElement>) => context.startLongPress(event, payload, id),
            onMouseUp: context.cancelLongPress,
            onMouseLeave: context.cancelLongPress,
            onDragStart: (event: DragEvent<HTMLTableRowElement>) => context.handleRowDragStart(event),
            onDragEnd: () => context.handleDragEnd(),
        }
    })()

    const itemId = item.kind !== "back" ? item.data.id : "back"
    const isDropTarget =
        context.dragOverTargetId !== null &&
        ((item.kind === "back" && context.dragOverTargetId === "back") ||
            (item.kind === "folder" && context.dragOverTargetId === item.data.id))

    const isDraggingThis =
        context.draggingPayload !== null &&
        ((item.kind === "folder" &&
            context.draggingPayload.kind === "folder" &&
            context.draggingPayload.id === item.data.id) ||
            (item.kind === "file" &&
                context.draggingPayload.kind === "file" &&
                context.draggingPayload.id === item.data.id))

    const isLongPressReady = context.longPressReadyId === itemId

    return {
        ...dropTargetProps,
        ...dragSourceProps,
        className: cn(
            isDropTarget
                ? css({
                      backgroundColor: "primary/6",
                  })
                : undefined,
            isDraggingThis
                ? css({
                      opacity: "0.4",
                  })
                : undefined,
            isLongPressReady
                ? css({
                      outline: "2px solid",
                      outlineColor: "primary/40",
                      outlineOffset: "-2px",
                      borderRadius: "sm",
                      backgroundColor: "primary/4",
                  })
                : undefined,
        ),
    }
}

function FilesTableRaw(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    files: Array<v.InferOutput<typeof returnedSchemas.file>>
    folders: Array<v.InferOutput<typeof returnedSchemas.folder>>
    currentFolderId: string | null
    parentFolderId: string | null
    onFolderOpen: (folderId: string | null) => void
    hasActiveFilters?: boolean
}) {
    const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null)
    const [draggingPayload, setDraggingPayload] = useState<DragPayload | null>(null)
    const [longPressReadyId, setLongPressReadyId] = useState<string | null>(null)
    const draggingPayloadRef = useRef<DragPayload | null>(null)
    const suppressClickRef = useRef(false)
    // Long-press-to-drag: 300ms hold activates draggable on the row
    const LONG_PRESS_MS = 300
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingDragRef = useRef<{
        row: HTMLTableRowElement
        payload: DragPayload
        id: string
    } | null>(null)

    function startLongPress(event: MouseEvent<HTMLTableRowElement>, payload: DragPayload, id: string) {
        if (event.button !== 0) return
        const row = event.currentTarget
        if (longPressTimerRef.current !== null) clearTimeout(longPressTimerRef.current)
        pendingDragRef.current = {
            row,
            payload,
            id,
        }
        longPressTimerRef.current = setTimeout(() => {
            if (pendingDragRef.current) {
                pendingDragRef.current.row.draggable = true
                pendingDragRef.current.row.style.cursor = "grab"
                setLongPressReadyId(pendingDragRef.current.id)
            }
        }, LONG_PRESS_MS)
    }

    function cancelLongPress() {
        if (longPressTimerRef.current !== null) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
        // Only reset if no drag is in progress
        if (pendingDragRef.current && draggingPayloadRef.current === null) {
            pendingDragRef.current.row.draggable = false
            pendingDragRef.current.row.style.cursor = ""
            pendingDragRef.current = null
            setLongPressReadyId(null)
        }
    }

    function handleRowDragStart(event: DragEvent<HTMLTableRowElement>) {
        const pending = pendingDragRef.current
        if (!pending) {
            event.preventDefault()
            return
        }
        event.dataTransfer.setData("text/plain", JSON.stringify(pending.payload))
        event.dataTransfer.effectAllowed = "move"
        const row = event.currentTarget
        const rect = row.getBoundingClientRect()
        event.dataTransfer.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top)
        suppressClickRef.current = true
        draggingPayloadRef.current = pending.payload
        setTimeout(() => {
            if (draggingPayloadRef.current !== null) {
                setDraggingPayload(draggingPayloadRef.current)
            }
        }, 0)
    }

    function handleDragEnd() {
        if (pendingDragRef.current) {
            pendingDragRef.current.row.draggable = false
            pendingDragRef.current.row.style.cursor = ""
            pendingDragRef.current = null
        }
        if (longPressTimerRef.current !== null) {
            clearTimeout(longPressTimerRef.current)
            longPressTimerRef.current = null
        }
        draggingPayloadRef.current = null
        setDraggingPayload(null)
        setDragOverTargetId(null)
        setLongPressReadyId(null)
        setTimeout(() => {
            suppressClickRef.current = false
        }, 0)
    }

    // Window-level fallback: if the element-level onDragEnd is missed (e.g. the DOM
    // node was replaced by a re-render mid-drag), this guarantees state is cleaned up.
    useEffect(() => {
        const onWindowDragEnd = () => {
            if (draggingPayloadRef.current === null) return
            if (pendingDragRef.current) {
                pendingDragRef.current.row.draggable = false
                pendingDragRef.current.row.style.cursor = ""
                pendingDragRef.current = null
            }
            draggingPayloadRef.current = null
            setDraggingPayload(null)
            setDragOverTargetId(null)
            setLongPressReadyId(null)
            setTimeout(() => {
                suppressClickRef.current = false
            }, 0)
        }
        window.addEventListener("dragend", onWindowDragEnd)
        return () => window.removeEventListener("dragend", onWindowDragEnd)
    }, [])

    function getRowInteractionProps(item: TableRow) {
        return buildRowInteractionProps(item, {
            parentFolderId: props.parentFolderId,
            dragOverTargetId,
            draggingPayload,
            longPressReadyId,
            setDragOverTargetId,
            handleDrop,
            startLongPress,
            cancelLongPress,
            handleRowDragStart,
            handleDragEnd,
        })
    }

    async function handleDrop(event: DragEvent, targetFolderId: string | null) {
        event.preventDefault()
        setDragOverTargetId(null)

        const payload = draggingPayloadRef.current ?? draggingPayload ?? getDragPayload(event)
        if (!payload) return
        if (
            !canDropOnTarget({
                payload,
                targetFolderId,
            })
        ) {
            handleDragEnd()
            return
        }

        if (payload.kind === "file") {
            const updateResponse = await getResponseBodyFromAPI({
                routeDefinition: updateOneFileRouteDefinition,
                body: {
                    idFile: payload.id,
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
            return
        }

        if (targetFolderId === payload.id) {
            return
        }

        const updateResponse = await getResponseBodyFromAPI({
            routeDefinition: updateOneFolderRouteDefinition,
            body: {
                idFolder: payload.id,
                idFolderParent: targetFolderId,
            },
        })

        if (updateResponse.ok === false) {
            toast({
                title: "Impossible de déplacer le dossier",
                variant: "error",
            })
            return
        }

        await invalidateData({
            routeDefinition: readAllFoldersRouteDefinition,
            body: {},
        })

        toast({
            title: "Dossier déplacé",
            variant: "success",
        })
    }

    const rows: Array<TableRow> = [
        ...(props.currentFolderId !== null
            ? [
                  {
                      kind: "back" as const,
                  },
              ]
            : []),
        ...props.folders.map((folder) => ({
            kind: "folder" as const,
            data: folder,
        })),
        ...props.files.map((file) => ({
            kind: "file" as const,
            data: file,
        })),
    ]

    const columns = useMemo(
        () =>
            buildFileTableColumns({
                idOrganization: props.idOrganization,
                parentFolderId: props.parentFolderId,
                onFolderOpen: props.onFolderOpen,
                suppressClickRef,
            }),
        [
            props.idOrganization,
            props.parentFolderId,
            props.onFolderOpen,
        ],
    )

    return (
        <DataTable
            data={rows}
            isLoading={false}
            persistKey="files"
            pageSize={100}
            showPageSizeControl={true}
            defaultSorting={[
                {
                    id: "createdAt",
                    desc: true,
                },
            ]}
            getRowProps={(row) => getRowInteractionProps(row.original)}
            hideSearchBar={false}
            enableRowSelection={(row) => row.original.kind !== "back"}
            getRowId={(row) => (row.kind === "back" ? "__back__" : row.data.id)}
            resetSelectionTrigger={props.currentFolderId}
            selectionActions={(selectedRows) => <FilesTableSelectionActions selectedRows={selectedRows} />}
            emptyStateProps={{
                icon: <IconFile />,
                title: "Aucun fichier",
                subtitle: "Les fichiers de votre exercice apparaîtront ici.",
            }}
            columns={columns}
        />
    )
}

export const FilesTable = memo(FilesTableRaw)
