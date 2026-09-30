import { Button, ButtonGhostContent, ButtonOutlineContent, Separator } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconCheck, IconTable, IconTableColumn, IconTableOff } from "@tabler/icons-react"
import { Popover } from "../overlays/popover/popover.js"

export type VisibilityColumn = {
    id: string
    header: string
    isVisible: boolean
    canHide: boolean
}

export function ColumnVisibilityPopover(props: {
    columns: Array<VisibilityColumn>
    onColumnVisibilityChange: (columnId: string, isVisible: boolean) => void
    onShowAll: () => void
    onDisableAll: () => void
    align?: "start" | "center" | "end" | undefined
}) {
    const hideableColumns = props.columns.filter((column) => column.canHide)
    const hiddenCount = hideableColumns.filter((column) => !column.isVisible).length
    const visibleCount = hideableColumns.length - hiddenCount

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button>
                    <ButtonOutlineContent
                        leftIcon={<IconTableColumn />}
                        text={
                            hiddenCount > 0
                                ? `(${hideableColumns.length - hiddenCount}/${hideableColumns.length})`
                                : undefined
                        }
                    />
                </Button>
            </Popover.Trigger>
            <Popover.Content
                align={props.align || "start"}
                className={{
                    width: "280px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    padding: "0.5rem",
                }}
            >
                {hiddenCount === 0 ? null : (
                    <Button
                        onClick={props.onShowAll}
                        className={{
                            width: "100%",
                        }}
                        isDisabled={hiddenCount === 0}
                    >
                        <ButtonGhostContent
                            leftIcon={<IconTable />}
                            text="Afficher toutes les colonnes"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                            isDisabled={hiddenCount === 0}
                        />
                    </Button>
                )}
                {visibleCount === 0 ? null : (
                    <Button
                        onClick={props.onDisableAll}
                        className={{
                            width: "100%",
                        }}
                        isDisabled={visibleCount === 0}
                    >
                        <ButtonGhostContent
                            color="danger"
                            leftIcon={<IconTableOff />}
                            text="Masquer toutes les colonnes"
                            className={{
                                width: "100%",
                                justifyContent: "start",
                            }}
                            isDisabled={visibleCount === 0}
                        />
                    </Button>
                )}
                <Separator />
                <div
                    className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                    })}
                >
                    {hideableColumns.map((column) => (
                        <div
                            key={column.id}
                            className={css({
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "0.75rem",
                            })}
                        >
                            <Button
                                onClick={() => props.onColumnVisibilityChange(column.id, !column.isVisible)}
                                className={{
                                    width: "100%",
                                }}
                            >
                                <ButtonGhostContent
                                    leftIcon={column.isVisible ? <IconCheck /> : undefined}
                                    text={column.header}
                                    className={{
                                        width: "100%",
                                        justifyContent: "start",
                                    }}
                                />
                            </Button>
                        </div>
                    ))}
                </div>
            </Popover.Content>
        </Popover.Root>
    )
}
