import { InputDebounced, InputText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { type ReactElement, useMemo, useState } from "react"
import { type FilterColumn, FilterPopover } from "../FilterPopover.js"
import { type SortDirection, SortPopover } from "../SortPopover.js"

export type ListTableColumn<TItem> = FilterColumn & {
    id: string
    header: string
    accessor: (item: TItem) => string | number | undefined | null
}

export function ListTableFilterable<TItem>(props: {
    items: Array<TItem>
    columns: Array<ListTableColumn<TItem>>
    children: (items: Array<TItem>) => ReactElement | Array<ReactElement> | null
}) {
    const [globalFilter, setGlobalFilter] = useState("")
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
    const [sorting, setSorting] = useState<
        Array<{
            id: string
            desc: boolean
        }>
    >([])

    const columnById = useMemo(
        () =>
            new Map(
                props.columns.map((col) => [
                    col.id,
                    col,
                ]),
            ),
        [
            props.columns,
        ],
    )

    const filteredAndSorted = useMemo(() => {
        let result = props.items

        if (globalFilter) {
            const lower = globalFilter.toLowerCase()
            result = result.filter((item) =>
                props.columns.some((col) => {
                    const value = col.accessor(item)
                    return value !== undefined && value !== null && String(value).toLowerCase().includes(lower)
                }),
            )
        }

        for (const [columnId, filterValue] of Object.entries(columnFilters)) {
            if (!filterValue) continue
            const column = columnById.get(columnId)
            if (!column) continue
            const lower = filterValue.toLowerCase()
            result = result.filter((item) => {
                const value = column.accessor(item)
                if (value === undefined || value === null) {
                    return false
                }

                const normalizedValue = String(value).toLowerCase()

                if (column.filterVariant === "combobox") {
                    return normalizedValue === lower
                }

                return normalizedValue.includes(lower)
            })
        }

        if (sorting.length > 0) {
            result = result.toSorted((a, b) => {
                for (const sort of sorting) {
                    const column = columnById.get(sort.id)
                    if (!column) continue
                    const aVal = column.accessor(a)
                    const bVal = column.accessor(b)
                    const aStr = aVal !== undefined && aVal !== null ? String(aVal) : ""
                    const bStr = bVal !== undefined && bVal !== null ? String(bVal) : ""
                    const comparison = aStr.localeCompare(bStr, undefined, {
                        numeric: true,
                    })
                    if (comparison !== 0) return sort.desc ? -comparison : comparison
                }
                return 0
            })
        }

        return result
    }, [
        props.items,
        props.columns,
        columnById,
        globalFilter,
        columnFilters,
        sorting,
    ])

    function setColumnFilter(columnId: string, value: string | undefined) {
        setColumnFilters((prev) => {
            const next = {
                ...prev,
            }
            if (value) {
                next[columnId] = value
            } else {
                delete next[columnId]
            }
            return next
        })
    }

    function clearAllFilters() {
        setColumnFilters({})
    }

    function toggleSort(columnId: string) {
        setSorting((prev) => {
            const existing = prev.find((s) => s.id === columnId)
            if (!existing)
                return [
                    ...prev,
                    {
                        id: columnId,
                        desc: false,
                    },
                ]
            if (!existing.desc)
                return prev.map((s) =>
                    s.id === columnId
                        ? {
                              ...s,
                              desc: true,
                          }
                        : s,
                )
            return prev.filter((s) => s.id !== columnId)
        })
    }

    function getSortDirection(columnId: string): SortDirection {
        const existing = sorting.find((s) => s.id === columnId)
        if (!existing) return false
        return existing.desc ? "desc" : "asc"
    }

    function clearAllSorts() {
        setSorting([])
    }

    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
            })}
        >
            <div
                className={css({
                    width: "100%",
                    display: "flex",
                    justifyContent: "start",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                })}
            >
                <InputDebounced
                    value={globalFilter ?? ""}
                    onChange={(value) => setGlobalFilter(value)}
                >
                    <InputText
                        placeholder="Recherche"
                        className={{
                            maxWidth: "320px",
                        }}
                    />
                </InputDebounced>
                <FilterPopover
                    columns={props.columns}
                    columnFilters={columnFilters}
                    onFilterChange={setColumnFilter}
                    onClearAll={clearAllFilters}
                />
                <SortPopover
                    columns={props.columns}
                    getSortDirection={getSortDirection}
                    onToggleSort={toggleSort}
                    onClearAll={clearAllSorts}
                    activeSortCount={sorting.length}
                />
            </div>
            {props.children(filteredAndSorted)}
        </div>
    )
}
