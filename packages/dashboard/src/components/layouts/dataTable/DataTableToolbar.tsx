import { cn, css } from "@comptasse/ui/utilities/cn.js"
import { type Table } from "@tanstack/react-table"
import { type ReactNode } from "react"
import { ColumnVisibilityPopover, type VisibilityColumn } from "../ColumnVisibilityPopover.js"
import { type FilterColumn, FilterPopover } from "../FilterPopover.js"
import { SearchBar } from "../SearchBar.js"
import { type SortDirection, SortPopover } from "../SortPopover.js"

export function DataTableToolbar<TData extends Record<keyof TData, unknown>>({
    table,
    globalFilter,
    onGlobalFilterChange,
    children,
}: {
    table: Table<TData>
    globalFilter: string
    onGlobalFilterChange: (value: string) => void
    children?: ReactNode
}) {
    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                justifyContent: "start",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "sm",
                color: "neutral/60",
            })}
        >
            <SearchBar
                value={globalFilter ?? ""}
                onChange={onGlobalFilterChange}
            />
            {(() => {
                const filterableColumns: Array<FilterColumn> = []
                for (const col of table.getAllColumns()) {
                    if (col.getCanFilter() && col.columnDef.header && col.columnDef.header !== " ") {
                        filterableColumns.push({
                            id: col.id,
                            header: col.columnDef.header?.toString() ?? "",
                        })
                    }
                }

                if (filterableColumns.length === 0) return null

                const filterRecord: Record<string, string> = {}
                for (const col of table.getAllColumns()) {
                    const val = col.getFilterValue()
                    if (val !== undefined) filterRecord[col.id] = String(val)
                }

                return (
                    <FilterPopover
                        align="end"
                        columns={filterableColumns}
                        columnFilters={filterRecord}
                        onFilterChange={(columnId, value) => {
                            table.getColumn(columnId)?.setFilterValue(value)
                        }}
                        onClearAll={() => {
                            for (const col of table.getAllColumns()) {
                                col.setFilterValue(undefined)
                            }
                        }}
                    />
                )
            })()}
            {(() => {
                const sortableColumns: Array<{
                    id: string
                    header: string
                }> = []
                for (const col of table.getAllColumns()) {
                    if (col.getCanSort() && col.columnDef.header && col.columnDef.header !== " ") {
                        sortableColumns.push({
                            id: col.id,
                            header: col.columnDef.header?.toString() ?? "",
                        })
                    }
                }

                if (sortableColumns.length === 0) return null

                const currentSorting = table.getState().sorting

                function getSortDirection(columnId: string): SortDirection {
                    const existing = currentSorting.find((s) => s.id === columnId)
                    if (!existing) return false
                    return existing.desc ? "desc" : "asc"
                }

                function toggleSort(columnId: string) {
                    const existing = currentSorting.find((s) => s.id === columnId)
                    if (!existing) {
                        table.setSorting([
                            ...currentSorting,
                            {
                                id: columnId,
                                desc: false,
                            },
                        ])
                    } else if (!existing.desc) {
                        table.setSorting(
                            currentSorting.map((s) =>
                                s.id === columnId
                                    ? {
                                          ...s,
                                          desc: true,
                                      }
                                    : s,
                            ),
                        )
                    } else {
                        table.setSorting(currentSorting.filter((s) => s.id !== columnId))
                    }
                }

                return (
                    <SortPopover
                        align="end"
                        columns={sortableColumns}
                        getSortDirection={getSortDirection}
                        onToggleSort={toggleSort}
                        onClearAll={() => table.setSorting([])}
                        activeSortCount={currentSorting.length}
                    />
                )
            })()}
            {(() => {
                const visibilityColumns: Array<VisibilityColumn> = []
                for (const col of table.getAllLeafColumns()) {
                    if (col.columnDef.header && col.columnDef.header !== " ") {
                        visibilityColumns.push({
                            id: col.id,
                            header: col.columnDef.header?.toString() ?? "",
                            isVisible: col.getIsVisible(),
                            canHide: col.getCanHide(),
                        })
                    }
                }

                const hasHideableColumns = visibilityColumns.some((column) => column.canHide)
                if (!hasHideableColumns) return null

                return (
                    <ColumnVisibilityPopover
                        align="end"
                        columns={visibilityColumns}
                        onColumnVisibilityChange={(columnId, isVisible) => {
                            table.getColumn(columnId)?.toggleVisibility(isVisible)
                        }}
                        onShowAll={() => {
                            for (const col of table.getAllLeafColumns()) {
                                if (!col.getCanHide()) continue
                                col.toggleVisibility(true)
                            }
                        }}
                        onDisableAll={() => {
                            for (const col of table.getAllLeafColumns()) {
                                if (!col.getCanHide()) continue
                                col.toggleVisibility(false)
                            }
                        }}
                    />
                )
            })()}
            <div
                className={css({
                    marginLeft: "auto",
                    display: "flex",
                    gap: "0.5rem",
                })}
            >
                {children}
            </div>
        </div>
    )
}
