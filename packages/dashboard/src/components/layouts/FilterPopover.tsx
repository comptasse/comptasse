import {
    Button,
    ButtonGhostContent,
    ButtonOutlineContent,
    ButtonPlainContent,
    InputCombobox,
    InputDebounced,
    InputText,
    Separator,
} from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconFilter, IconX } from "@tabler/icons-react"
import { Popover } from "../overlays/popover/popover.js"

export type FilterColumn = {
    id: string
    header: string
    filterVariant?: "text" | "combobox"
    filterOptions?: Array<{
        key: string
        label: string
    }>
    align?: "start" | "center" | "end" | undefined
}

export function FilterPopover(props: {
    columns: Array<FilterColumn>
    columnFilters: Record<string, string>
    onFilterChange: (columnId: string, value: string | undefined) => void
    onClearAll: () => void
    align?: "start" | "center" | "end" | undefined
}) {
    const activeFilterCount = Object.values(props.columnFilters).filter(Boolean).length

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <Button>
                    {activeFilterCount > 0 ? (
                        <ButtonPlainContent
                            leftIcon={<IconFilter />}
                            // text={`Filtrer (${activeFilterCount})`}
                            text={`(${activeFilterCount})`}
                        />
                    ) : (
                        <ButtonOutlineContent
                            leftIcon={<IconFilter />}
                            // text="Filtrer"
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
                    isDisabled={activeFilterCount === 0}
                >
                    <ButtonGhostContent
                        color="danger"
                        leftIcon={<IconX />}
                        text="Effacer les filtres"
                        className={{
                            width: "100%",
                            justifyContent: "start",
                        }}
                        isDisabled={activeFilterCount === 0}
                    />
                </Button>
                <Separator />
                <div
                    className={css({
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    })}
                >
                    {props.columns.map((column) => (
                        <div
                            key={column.id}
                            className={css({
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.25rem",
                            })}
                        >
                            <span
                                className={css({
                                    fontSize: "xs",
                                    fontWeight: "medium",
                                    textTransform: "uppercase",
                                    color: "neutral/50",
                                })}
                            >
                                {column.header}
                            </span>
                            {column.filterVariant === "combobox" ? (
                                <InputCombobox
                                    value={props.columnFilters[column.id] ?? undefined}
                                    onChange={(value) => props.onFilterChange(column.id, value ?? undefined)}
                                    allowEmpty={true}
                                    placeholder={`Choisir ${column.header.toLowerCase()}`}
                                    options={column.filterOptions ?? []}
                                />
                            ) : (
                                <InputDebounced
                                    value={props.columnFilters[column.id] ?? ""}
                                    onChange={(value) => props.onFilterChange(column.id, value || undefined)}
                                >
                                    <InputText placeholder={`Filtrer par ${column.header.toLowerCase()}`} />
                                </InputDebounced>
                            )}
                        </div>
                    ))}
                </div>
            </Popover.Content>
        </Popover.Root>
    )
}
