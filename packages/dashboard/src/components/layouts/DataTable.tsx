import {
    Button,
    ButtonGhostContent,
    ButtonOutlineContent,
    CircularLoader,
    FormatNull,
    InputCheckbox,
    InputNumber,
} from "@comptasse/ui"
import { cn, css } from "@comptasse/ui/utilities/cn.js"
import {
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconDatabaseOff,
    IconSortAscending,
    IconSortDescending,
} from "@tabler/icons-react"
import {
    type ColumnDef,
    type ColumnFiltersState,
    type ColumnSizingState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type Row,
    type RowData,
    type RowSelectionState,
    type SortingState,
    type Table,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table"
import {
    type ComponentProps,
    Fragment,
    memo,
    type ReactElement,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { ColumnVisibilityPopover, type VisibilityColumn } from "./ColumnVisibilityPopover.js"
import { EmptyState } from "./EmptyState.js"
import { type FilterColumn, FilterPopover } from "./FilterPopover.js"
import { SearchBar } from "./SearchBar.js"
import { type SortDirection, SortPopover } from "./SortPopover.js"

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        fit?: boolean
    }
}

function computeAutoColumnSizing<TData extends Record<keyof TData, unknown>>(
    columns: Array<ColumnDef<TData>>,
    data: Array<TData>,
): ColumnSizingState {
    const maxWidth = 200
    const minWidth = 80
    const basePadding = 24
    const pixelsPerCharacter = 8
    const sampledRows = data.slice(0, 200)
    const computedSizing: ColumnSizingState = {}

    for (const column of columns) {
        const columnWithAccessor = column as typeof column & {
            accessorKey?: keyof TData | string
            accessorFn?: (row: TData, rowIndex: number) => unknown
        }
        const columnId =
            column.id ??
            (typeof columnWithAccessor.accessorKey === "string" ? columnWithAccessor.accessorKey : undefined)

        if (!columnId || column.meta?.fit === true) {
            continue
        }

        let longestValueLength = typeof column.header === "string" ? column.header.length : 0

        for (const [rowIndex, row] of sampledRows.entries()) {
            let value: unknown = ""

            if (typeof columnWithAccessor.accessorFn === "function") {
                value = columnWithAccessor.accessorFn(row, rowIndex)
            } else if (typeof columnWithAccessor.accessorKey === "string") {
                value = row[columnWithAccessor.accessorKey as keyof TData]
            }

            const valueLength = String(value ?? "").length
            if (valueLength > longestValueLength) {
                longestValueLength = valueLength
            }
        }

        computedSizing[columnId] = Math.max(
            minWidth,
            Math.min(maxWidth, Math.ceil(longestValueLength * pixelsPerCharacter + basePadding)),
        )
    }

    return computedSizing
}

function DataTableToolbar<TData extends Record<keyof TData, unknown>>({
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

function DataTableHeader<TData extends Record<keyof TData, unknown>>({
    table,
    renderSubComponent,
    columnCount,
    onResetColumnSize,
}: {
    table: Table<TData>
    renderSubComponent?: (context: { row: Row<TData> }) => ReactElement | null
    columnCount: number
    onResetColumnSize: (columnId: string) => void
}) {
    return (
        <thead
            className={css({
                width: "100%",
                position: "sticky",
                top: "0",
                zIndex: "1",
                backgroundColor: "white",
            })}
        >
            <tr
                className={css({
                    width: "100%",
                })}
            >
                {renderSubComponent && (
                    <th
                        className={css({
                            width: "1%",
                            borderBottom: "1px solid",
                            borderBottomColor: "neutral/10",
                        })}
                    />
                )}
                {table.getFlatHeaders().map((header) => {
                    const isFit = header.column.columnDef.meta?.fit === true
                    const boundedHeaderSize = Math.min(header.getSize(), 200)
                    return (
                        <th
                            key={header.id}
                            colSpan={header.colSpan}
                            style={
                                isFit
                                    ? undefined
                                    : {
                                          minWidth: `calc(100% / ${columnCount})`,
                                      }
                            }
                            className={css({
                                position: "relative",
                                width: isFit ? "1%" : `${boundedHeaderSize}px`,
                                minWidth: isFit ? "0" : undefined,
                                whiteSpace: isFit ? "nowrap" : undefined,
                                borderBottom: "1px solid",
                                borderBottomColor: "neutral/10",
                            })}
                        >
                            <div
                                className={css({
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    padding: "1rem",
                                })}
                            >
                                {header.column.columnDef.header === undefined ? null : typeof header.column.columnDef
                                      .header === "function" ? (
                                    flexRender(header.column.columnDef.header, header.getContext())
                                ) : (
                                    <Button onClick={header.column.getToggleSortingHandler()}>
                                        <ButtonGhostContent
                                            leftIcon={
                                                {
                                                    asc: <IconSortAscending />,
                                                    desc: <IconSortDescending />,
                                                }[String(header.column.getIsSorted())] ?? undefined
                                            }
                                            text={header.column.columnDef.header.toString()}
                                        />
                                    </Button>
                                )}
                            </div>
                            {!isFit && (
                                <div
                                    role="separator"
                                    aria-orientation="vertical"
                                    aria-label="Redimensionner la colonne"
                                    tabIndex={0}
                                    onDoubleClick={() => onResetColumnSize(header.column.id)}
                                    onMouseDown={header.getResizeHandler()}
                                    onTouchStart={header.getResizeHandler()}
                                    className={css({
                                        position: "absolute",
                                        top: 0,
                                        right: 0,
                                        width: "0.5rem",
                                        height: "100%",
                                        cursor: "col-resize",
                                        userSelect: "none",
                                        touchAction: "none",
                                        backgroundColor: "transparent",
                                        transition: "background-color 120ms ease",
                                        _hover: {
                                            backgroundColor: "neutral/10",
                                        },
                                        _focusVisible: {
                                            backgroundColor: "neutral/10",
                                        },
                                    })}
                                />
                            )}
                        </th>
                    )
                })}
            </tr>
        </thead>
    )
}

function DataTableRow<TData extends Record<keyof TData, unknown>>({
    row,
    columnCount,
    onRowClick,
    renderSubComponent,
    getRowProps,
}: {
    row: Row<TData>
    columnCount: number
    onRowClick?: (context: Row<TData>) => void
    renderSubComponent?: (context: { row: Row<TData> }) => ReactElement | null
    getRowProps?: (row: Row<TData>) => ComponentProps<"tr">
}) {
    const { className: rowExtraClassName, onClick: _rowOnClick, ...rowExtraProps } = getRowProps?.(row) ?? {}

    return (
        <Fragment>
            <tr
                {...rowExtraProps}
                onClick={(event) => {
                    event.stopPropagation()
                    if (!onRowClick) return
                    onRowClick(row)
                }}
                className={cn(
                    css({
                        width: "100%",
                        borderBottom: "1px solid",
                        borderBottomColor: "neutral/5",
                        _last: {
                            borderBottom: "0",
                        },
                    }),
                    !onRowClick
                        ? undefined
                        : css({
                              cursor: "pointer",
                              _hover: {
                                  backgroundColor: "neutral/5",
                              },
                          }),
                    row.getIsExpanded()
                        ? css({
                              borderBottomColor: "neutral/10",
                          })
                        : undefined,
                    rowExtraClassName,
                )}
            >
                {renderSubComponent && (
                    <td
                        className={css({
                            width: "1%",
                        })}
                    >
                        <div
                            className={css({
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                padding: "0.5rem",
                            })}
                        >
                            <Button
                                onClick={(event) => {
                                    event.stopPropagation()
                                    row.toggleExpanded()
                                }}
                            >
                                <ButtonGhostContent
                                    leftIcon={row.getIsExpanded() ? <IconChevronDown /> : <IconChevronRight />}
                                    text={undefined}
                                />
                            </Button>
                        </div>
                    </td>
                )}
                {row.getVisibleCells().map((cell) => {
                    const isFit = cell.column.columnDef.meta?.fit === true
                    const boundedCellSize = Math.min(cell.column.getSize(), 200)
                    return (
                        <td
                            key={cell.id}
                            style={
                                isFit
                                    ? undefined
                                    : {
                                          minWidth: `calc(100% / ${columnCount})`,
                                      }
                            }
                            className={css({
                                width: isFit ? "1%" : `${boundedCellSize}px`,
                                minWidth: isFit ? "0" : undefined,
                                whiteSpace: isFit ? "nowrap" : undefined,
                                _last: {
                                    width: "1%",
                                },
                            })}
                        >
                            <div
                                className={css({
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    padding: "1rem",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                })}
                            >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                        </td>
                    )
                })}
            </tr>
            {row.getIsExpanded() && renderSubComponent && (
                <tr
                    className={css({
                        width: "100%",
                        borderBottom: "1px solid",
                        borderBottomColor: "neutral/5",
                        backgroundColor: "neutral/2",
                        _last: {
                            borderBottom: "0",
                        },
                    })}
                >
                    <td
                        colSpan={row.getVisibleCells().length + 1}
                        className={css({
                            padding: "0",
                        })}
                    >
                        {renderSubComponent({
                            row,
                        })}
                    </td>
                </tr>
            )}
        </Fragment>
    )
}

function DataTablePagination<TData extends Record<keyof TData, unknown>>({
    table,
    showPageSizeControl,
}: {
    table: Table<TData>
    showPageSizeControl?: boolean
}) {
    const pageCount = table.getPageCount()
    if (pageCount <= 1 && showPageSizeControl !== true) return null

    const rowCount = table.getFilteredRowModel().rows.length
    const pageSize = table.getState().pagination.pageSize

    return (
        <div
            className={css({
                flexShrink: "0",
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "4",
            })}
        >
            <div
                className={css({
                    display: "flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                })}
            >
                <span
                    className={css({
                        fontSize: "sm",
                        color: "neutral/50",
                    })}
                >
                    {rowCount} résultat
                    {rowCount > 1 ? "s" : ""}
                </span>
                {showPageSizeControl === true ? (
                    <div
                        className={css({
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "0.5rem",
                        })}
                    >
                        <span
                            className={css({
                                fontSize: "sm",
                                color: "neutral/50",
                            })}
                        >
                            Lignes par page
                        </span>
                        <InputNumber
                            value={pageSize}
                            min={1}
                            label="Lignes par page"
                            onChange={(value) => table.setPageSize(Math.max(1, value))}
                        />
                    </div>
                ) : null}
            </div>
            <div
                className={css({
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.5rem",
                })}
            >
                <Button
                    onClick={() => table.previousPage()}
                    isDisabled={!table.getCanPreviousPage()}
                >
                    <ButtonOutlineContent
                        leftIcon={<IconChevronLeft />}
                        text={undefined}
                        isDisabled={!table.getCanPreviousPage()}
                    />
                </Button>
                <span
                    className={css({
                        fontSize: "sm",
                        color: "neutral/50",
                    })}
                >
                    Page {table.getState().pagination.pageIndex + 1} sur {pageCount}
                </span>
                <Button
                    onClick={() => table.nextPage()}
                    isDisabled={!table.getCanNextPage()}
                >
                    <ButtonOutlineContent
                        leftIcon={<IconChevronRight />}
                        text={undefined}
                        isDisabled={!table.getCanNextPage()}
                    />
                </Button>
            </div>
        </div>
    )
}

function DataTableRaw<TData extends Record<keyof TData, unknown>>(props: {
    data: Array<TData>
    isLoading?: boolean
    columns: Array<ColumnDef<TData>>
    pageSize?: number
    showPageSizeControl?: boolean
    defaultColumnVisibility?: VisibilityState
    onRowClick?: (context: Row<TData>) => void
    renderSubComponent?: (context: { row: Row<TData> }) => ReactElement | null
    getRowProps?: (row: Row<TData>) => ComponentProps<"tr">
    hideSearchBar?: boolean
    children?: ReactNode
    enableRowSelection?: boolean | ((row: Row<TData>) => boolean)
    getRowId?: (row: TData, index: number) => string
    selectionActions?: (selectedRows: Array<Row<TData>>) => ReactElement | null
    resetSelectionTrigger?: unknown
    emptyStateProps?: Parameters<typeof EmptyState>[0]
}) {
    const memoizedData = useMemo(
        () => props.data,
        [
            props.data,
        ],
    )
    const [globalFilter, setGlobalFilter] = useState("")
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(props.defaultColumnVisibility ?? {})
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [columnSizingOverrides, setColumnSizingOverrides] = useState<ColumnSizingState>({})

    // Reset selection when the trigger changes (e.g. folder navigation)
    useEffect(() => {
        setRowSelection((prev) => (Object.keys(prev).length > 0 ? {} : prev))
    }, [
        props.resetSelectionTrigger,
    ])

    const selectColumnDef = useMemo<ColumnDef<TData>>(
        () => ({
            id: "__select",
            meta: {
                fit: true,
            },
            enableSorting: false,
            enableGlobalFilter: false,
            enableHiding: false,
            header: ({ table }) => {
                const selectedRows = table.getSelectedRowModel().rows
                return (
                    <div
                        className={css({
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                        })}
                    >
                        <InputCheckbox
                            checked={table.getIsAllRowsSelected()}
                            indeterminate={table.getIsSomeRowsSelected()}
                            onChange={(checked) => table.toggleAllRowsSelected(checked)}
                            onClick={(event) => event.stopPropagation()}
                        />
                        {selectedRows.length > 0 && props.selectionActions?.(selectedRows)}
                    </div>
                )
            },
            cell: ({ row }) =>
                row.getCanSelect() ? (
                    <InputCheckbox
                        checked={row.getIsSelected()}
                        onChange={(checked) => row.toggleSelected(checked)}
                        onClick={(event) => event.stopPropagation()}
                    />
                ) : null,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            props.selectionActions,
        ],
    )

    const memoizedUserColumns = useMemo(
        () =>
            props.columns.map((column) => ({
                ...column,
                enableMultiSort: true,
            })),
        [
            props.columns,
        ],
    )

    const allColumns = useMemo(
        () =>
            props.enableRowSelection !== undefined && props.enableRowSelection !== false
                ? [
                      selectColumnDef,
                      ...memoizedUserColumns,
                  ]
                : memoizedUserColumns,
        [
            props.enableRowSelection,
            selectColumnDef,
            memoizedUserColumns,
        ],
    )

    const autoColumnSizing = useMemo(
        () => computeAutoColumnSizing(allColumns, memoizedData),
        [
            allColumns,
            memoizedData,
        ],
    )

    const columnSizing = useMemo<ColumnSizingState>(
        () => ({
            ...autoColumnSizing,
            ...columnSizingOverrides,
        }),
        [
            autoColumnSizing,
            columnSizingOverrides,
        ],
    )

    const table = useReactTable<TData>({
        data: memoizedData,
        columns: allColumns,
        getRowId: props.getRowId,
        enableRowSelection: props.enableRowSelection,
        getRowCanExpand: () => !!props.renderSubComponent,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnSizingChange: setColumnSizingOverrides,
        enableMultiSort: true,
        enableColumnResizing: true,
        columnResizeMode: "onChange",
        defaultColumn: {
            minSize: 80,
            size: 120,
            maxSize: 200,
        },
        initialState: {
            pagination: {
                pageSize: props.pageSize ?? 10,
            },
        },
        state: {
            globalFilter,
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            columnSizing,
        },
    })

    if (props.isLoading)
        return (
            <CircularLoader
                className={{
                    m: "3",
                }}
            />
        )
    const columnCount = table.getFlatHeaders().length + (props.renderSubComponent ? 1 : 0)
    if (props.data.length === 0) {
        return (
            <div
                className={css({
                    width: "100%",
                    maxWidth: "100%",
                    // maxHeight: "70vh",
                    padding: "0",
                    overflowX: "auto",
                    overflowY: "auto",
                    borderRadius: "lg",
                    border: "1px solid",
                    borderColor: "neutral/10",
                })}
            >
                <EmptyState
                    icon={props.emptyStateProps?.icon ?? <IconDatabaseOff />}
                    title={props.emptyStateProps?.title ?? "Aucun résultat"}
                    subtitle={props.emptyStateProps?.subtitle}
                />
            </div>
        )
    }

    return (
        <div
            className={css({
                flexShrink: "0",
                width: "100%",
                height: "fit",
                maxHeight: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "stretch",
                gap: "0.5rem",
            })}
        >
            {!props.hideSearchBar && (
                <DataTableToolbar
                    table={table}
                    globalFilter={globalFilter}
                    onGlobalFilterChange={setGlobalFilter}
                >
                    {props.children}
                </DataTableToolbar>
            )}
            <div
                className={css({
                    width: "100%",
                    maxWidth: "100%",
                    // maxHeight: "70vh",
                    padding: "0",
                    overflowX: "auto",
                    overflowY: "auto",
                    borderRadius: "lg",
                    border: "1px solid",
                    borderColor: "neutral/10",
                })}
            >
                <table
                    className={css({
                        width: "fit-content",
                        minWidth: "100%",
                        height: "100%",
                        maxH: "100%",
                        borderCollapse: "collapse",
                    })}
                >
                    <DataTableHeader
                        table={table}
                        renderSubComponent={props.renderSubComponent}
                        columnCount={columnCount}
                        onResetColumnSize={(columnId) => {
                            setColumnSizingOverrides((state) => {
                                const nextState = {
                                    ...state,
                                }
                                delete nextState[columnId]
                                return nextState
                            })
                        }}
                    />
                    <tbody
                        className={css({
                            width: "100%",
                            height: "fit",
                        })}
                    >
                        {table.getRowModel().rows.length > 0 ? null : (
                            <tr>
                                <td>
                                    <FormatNull
                                        text="Aucun résultat"
                                        className={{
                                            padding: "1rem",
                                        }}
                                    />
                                </td>
                            </tr>
                        )}
                        {table.getRowModel().rows.map((row) => (
                            <DataTableRow
                                key={row.id}
                                row={row}
                                columnCount={columnCount}
                                onRowClick={props.onRowClick}
                                renderSubComponent={props.renderSubComponent}
                                getRowProps={props.getRowProps}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            <DataTablePagination
                table={table}
                showPageSizeControl={props.showPageSizeControl}
            />
        </div>
    )
}

export const DataTable = memo(DataTableRaw) as typeof DataTableRaw
