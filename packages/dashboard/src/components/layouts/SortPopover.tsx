import { Button, ButtonGhostContent, ButtonOutlineContent, ButtonPlainContent, Separator } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconArrowsSort, IconSortAscendingLetters, IconSortDescendingLetters, IconX } from "@tabler/icons-react"
import { Popover } from "../overlays/popover/popover.js"

export type SortDirection = "asc" | "desc" | false

export type SortColumn = {
    id: string
    header: string
}

export function SortPopover(props: {
    columns: Array<SortColumn>
    getSortDirection: (columnId: string) => SortDirection
    onToggleSort: (columnId: string) => void
    onClearAll: () => void
    activeSortCount: number
    align?: "start" | "center" | "end" | undefined
}) {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button>
                    {props.activeSortCount > 0 ? (
                        <ButtonPlainContent
                            leftIcon={<IconArrowsSort />}
                            // text={`Trier (${props.activeSortCount})`}
                            text={`(${props.activeSortCount})`}
                        />
                    ) : (
                        <ButtonOutlineContent
                            leftIcon={<IconArrowsSort />}
                            // text="Trier"
                        />
                    )}
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
                <Button
                    onClick={props.onClearAll}
                    className={{
                        width: "100%",
                    }}
                    isDisabled={props.activeSortCount === 0}
                >
                    <ButtonGhostContent
                        color="danger"
                        leftIcon={<IconX />}
                        text="Effacer le tri"
                        className={{
                            width: "100%",
                            justifyContent: "start",
                        }}
                        isDisabled={props.activeSortCount === 0}
                    />
                </Button>
                <Separator />
                <div
                    className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                    })}
                >
                    {props.columns.map((column) => {
                        const direction = props.getSortDirection(column.id)
                        return (
                            <div
                                key={column.id}
                                className={css({
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "1rem",
                                })}
                            >
                                <Button
                                    onClick={() => props.onToggleSort(column.id)}
                                    className={{
                                        width: "100%",
                                    }}
                                >
                                    <ButtonGhostContent
                                        leftIcon={
                                            direction === "asc" ? (
                                                <IconSortAscendingLetters />
                                            ) : direction === "desc" ? (
                                                <IconSortDescendingLetters />
                                            ) : undefined
                                        }
                                        text={column.header}
                                        className={{
                                            width: "100%",
                                            justifyContent: "start",
                                        }}
                                    />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </Popover.Content>
        </Popover.Root>
    )
}
