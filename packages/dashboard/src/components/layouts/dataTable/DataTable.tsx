import { Button, ButtonGhostContent, CircularLoader, FormatNull, InputCheckbox } from "@comptasse/ui"
import { cn, css } from "@comptasse/ui/utilities/cn.js"
import {
    IconChevronDown,
    IconChevronRight,
    IconDatabaseOff,
    IconSortAscending,
    IconSortDescending,
} from "@tabler/icons-react"
import {
    type ColumnDef,
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
    type Table,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
    type ComponentProps,
    Fragment,
    memo,
    type ReactElement,
    type ReactNode,
    type RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { usePersistentDataTableState } from "../../../utilities/usePersistentDataTableState.js"
import { EmptyState } from "../EmptyState.js"
import { DataTablePagination } from "./DataTablePagination.js"
import { DataTableToolbar } from "./DataTableToolbar.js"
import { includesStringOrBoolean } from "./filterFns.js"

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        fit?: boolean
        /** Labels matched by the filters for boolean values (defaults to Oui / Non). */
        booleanLabels?: {
            true?: string
            false?: string
        }
        /** Extra text matched by the filters in addition to the raw value. */
        filterText?: (value: TValue, row: TData) => string
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
    dataIndex,
    measureElement,
}: {
    row: Row<TData>
    columnCount: number
    onRowClick?: (context: Row<TData>) => void
    renderSubComponent?: (context: { row: Row<TData> }) => ReactElement | null
    getRowProps?: (row: Row<TData>) => ComponentProps<"tr">
    dataIndex?: number
    measureElement?: (element: Element | null) => void
}) {
    const { className: rowExtraClassName, onClick: _rowOnClick, ...rowExtraProps } = getRowProps?.(row) ?? {}

    return (
        <tbody
            data-index={dataIndex}
            ref={measureElement}
        >
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
        </tbody>
    )
}

function DataTableRows<TData extends Record<keyof TData, unknown>>(props: {
    rows: Array<Row<TData>>
    columnCount: number
    virtualize: boolean
    virtualItems: Array<{
        index: number
    }>
    virtualPaddingTop: number
    virtualPaddingBottom: number
    measureElement: (element: Element | null) => void
    onRowClick?: (context: Row<TData>) => void
    renderSubComponent?: (context: { row: Row<TData> }) => ReactElement | null
    getRowProps?: (row: Row<TData>) => ComponentProps<"tr">
}) {
    if (props.virtualize) {
        return (
            <Fragment>
                {props.virtualPaddingTop > 0 && (
                    <tbody>
                        <tr>
                            <td
                                colSpan={props.columnCount}
                                style={{
                                    height: `${props.virtualPaddingTop}px`,
                                    padding: 0,
                                    border: 0,
                                }}
                            />
                        </tr>
                    </tbody>
                )}
                {props.virtualItems.map((virtualItem) => {
                    const row = props.rows[virtualItem.index]
                    return (
                        <DataTableRow
                            key={row.id}
                            row={row}
                            columnCount={props.columnCount}
                            onRowClick={props.onRowClick}
                            renderSubComponent={props.renderSubComponent}
                            getRowProps={props.getRowProps}
                            dataIndex={virtualItem.index}
                            measureElement={props.measureElement}
                        />
                    )
                })}
                {props.virtualPaddingBottom > 0 && (
                    <tbody>
                        <tr>
                            <td
                                colSpan={props.columnCount}
                                style={{
                                    height: `${props.virtualPaddingBottom}px`,
                                    padding: 0,
                                    border: 0,
                                }}
                            />
                        </tr>
                    </tbody>
                )}
            </Fragment>
        )
    }

    return (
        <Fragment>
            {props.rows.length > 0 ? null : (
                <tbody>
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
                </tbody>
            )}
            {props.rows.map((row) => (
                <DataTableRow
                    key={row.id}
                    row={row}
                    columnCount={props.columnCount}
                    onRowClick={props.onRowClick}
                    renderSubComponent={props.renderSubComponent}
                    getRowProps={props.getRowProps}
                />
            ))}
        </Fragment>
    )
}

function DataTableTable<TData extends Record<keyof TData, unknown>>(props: {
    table: Table<TData>
    columnCount: number
    rows: Array<Row<TData>>
    virtualize: boolean
    virtualItems: Array<{
        index: number
    }>
    virtualPaddingTop: number
    virtualPaddingBottom: number
    measureElement: (element: Element | null) => void
    scrollContainerRef: RefObject<HTMLDivElement | null>
    renderSubComponent?: (context: { row: Row<TData> }) => ReactElement | null
    onRowClick?: (context: Row<TData>) => void
    getRowProps?: (row: Row<TData>) => ComponentProps<"tr">
    onResetColumnSize: (columnId: string) => void
}) {
    return (
        <div
            ref={props.scrollContainerRef}
            className={css({
                width: "100%",
                maxWidth: "100%",
                maxHeight: props.virtualize ? "70vh" : undefined,
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
                    table={props.table}
                    renderSubComponent={props.renderSubComponent}
                    columnCount={props.columnCount}
                    onResetColumnSize={props.onResetColumnSize}
                />
                <DataTableRows
                    rows={props.rows}
                    columnCount={props.columnCount}
                    virtualize={props.virtualize}
                    virtualItems={props.virtualItems}
                    virtualPaddingTop={props.virtualPaddingTop}
                    virtualPaddingBottom={props.virtualPaddingBottom}
                    measureElement={props.measureElement}
                    onRowClick={props.onRowClick}
                    renderSubComponent={props.renderSubComponent}
                    getRowProps={props.getRowProps}
                />
            </table>
        </div>
    )
}

function DataTableRaw<TData extends Record<keyof TData, unknown>>(props: {
    data: Array<TData>
    isLoading?: boolean
    columns: Array<ColumnDef<TData>>
    pageSize?: number
    showPageSizeControl?: boolean
    /** Only mount the rows currently in view (for large pages). */
    virtualize?: boolean
    /** Estimated row height in px, used before rows are measured. */
    estimateRowHeight?: number
    /** localStorage key: persists sorting, filters and column visibility per table. */
    persistKey?: string
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
    const {
        globalFilter,
        setGlobalFilter,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        columnVisibility,
        setColumnVisibility,
    } = usePersistentDataTableState(props.persistKey, props.defaultColumnVisibility ?? {})
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
        globalFilterFn: includesStringOrBoolean,
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

    const scrollContainerRef = useRef<HTMLDivElement | null>(null)
    const rows = table.getRowModel().rows
    const estimateRowHeight = props.estimateRowHeight ?? 45
    const virtualizer = useVirtualizer({
        count: props.virtualize === true ? rows.length : 0,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => estimateRowHeight,
        measureElement: (element) => element?.getBoundingClientRect().height ?? estimateRowHeight,
        overscan: 8,
    })
    const virtualItems = props.virtualize === true ? virtualizer.getVirtualItems() : []
    const virtualPaddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
    const virtualPaddingBottom =
        virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0

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
            <DataTableTable
                table={table}
                columnCount={columnCount}
                rows={rows}
                virtualize={props.virtualize === true}
                virtualItems={virtualItems}
                virtualPaddingTop={virtualPaddingTop}
                virtualPaddingBottom={virtualPaddingBottom}
                measureElement={virtualizer.measureElement}
                scrollContainerRef={scrollContainerRef}
                renderSubComponent={props.renderSubComponent}
                onRowClick={props.onRowClick}
                getRowProps={props.getRowProps}
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
            <DataTablePagination
                table={table}
                showPageSizeControl={props.showPageSizeControl}
            />
        </div>
    )
}

export const DataTable = memo(DataTableRaw) as typeof DataTableRaw
