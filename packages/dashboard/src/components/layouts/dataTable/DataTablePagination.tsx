import { Button, ButtonOutlineContent, InputNumber } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import type { Table } from "@tanstack/react-table"

export function DataTablePagination<TData extends Record<keyof TData, unknown>>({
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
