import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Fragment, useMemo, useRef } from "react"
import type * as v from "valibot"
import { Table } from "../../../../../components/layouts/table/table.tsx"

type EntryLine = v.InferOutput<typeof returnedSchemas.entryLine>
type Account = v.InferOutput<typeof returnedSchemas.account>
type Entry = v.InferOutput<typeof returnedSchemas.entry>

function LedgerAccountSection({
    account,
    entryLines,
    entryById,
    virtualItem,
    measureElement,
}: {
    account: Account
    entryLines: Array<EntryLine>
    entryById: Map<string, Entry>
    virtualItem: ReturnType<ReturnType<typeof useVirtualizer>["getVirtualItems"]>[number]
    measureElement: (element: Element | null) => void
}) {
    const accountTotalDebit = entryLines.reduce((acc, entryLine) => acc + Number(entryLine.debit), 0)
    const accountTotalCredit = entryLines.reduce((acc, entryLine) => acc + Number(entryLine.credit), 0)

    return (
        <Table.Body.Root
            data-index={virtualItem.index}
            ref={measureElement}
            className={css({
                borderY: "1px solid token(colors.neutral/10)",
                _last: {
                    borderBottom: "0",
                },
            })}
        >
            <Table.Body.Row
                className={css({
                    borderColor: "neutral/10",
                    backgroundColor: "background",
                })}
            >
                <Table.Body.Cell>
                    <div
                        className={css({
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "start",
                            gap: "0.5rem",
                        })}
                    >
                        <FormatText
                            className={{
                                overflow: "visible",
                            }}
                        >
                            {account.number}
                        </FormatText>
                        <FormatText
                            wrap={true}
                            className={{
                                color: "neutral/50",
                            }}
                        >
                            {account.label}
                        </FormatText>
                    </div>
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice
                        price={accountTotalDebit}
                        className={{
                            fontWeight: "bold",
                        }}
                    />
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice
                        price={accountTotalCredit}
                        className={{
                            fontWeight: "bold",
                        }}
                    />
                </Table.Body.Cell>
            </Table.Body.Row>
            {/* biome-ignore lint/complexity/noUselessFragments: Fragment needed for TypeScript type compatibility with Table.Body.Root children */}
            <Fragment>
                {entryLines.map((entryLine) => {
                    return (
                        <Table.Body.Row
                            key={entryLine.id}
                            className={css({
                                borderColor: "neutral/5",
                            })}
                        >
                            <Table.Body.Cell>
                                <FormatText
                                    className={{
                                        color: "neutral/50",
                                    }}
                                >
                                    {entryById.get(entryLine.idEntry)?.label ?? ""}
                                </FormatText>
                            </Table.Body.Cell>
                            <Table.Body.Cell
                                className={css({
                                    width: "[1%]",
                                })}
                                align="right"
                            >
                                <FormatPrice price={entryLine.debit} />
                            </Table.Body.Cell>
                            <Table.Body.Cell
                                className={css({
                                    width: "[1%]",
                                })}
                                align="right"
                            >
                                <FormatPrice price={entryLine.credit} />
                            </Table.Body.Cell>
                        </Table.Body.Row>
                    )
                })}
            </Fragment>
        </Table.Body.Root>
    )
}

export function LedgerReportTable(props: {
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
    entries: Array<v.InferOutput<typeof returnedSchemas.entry>>
}) {
    const accountsTotalDebit = props.entryLines.reduce((acc, entryLine) => acc + Number(entryLine.debit), 0)
    const accountsTotalCredit = props.entryLines.reduce((acc, entryLine) => acc + Number(entryLine.credit), 0)

    const entryById = useMemo(() => {
        const map = new Map<string, Entry>()
        for (const entry of props.entries) {
            map.set(entry.id, entry)
        }
        return map
    }, [
        props.entries,
    ])

    const entryLinesByAccountId = useMemo(() => {
        const map = new Map<string, Array<v.InferOutput<typeof returnedSchemas.entryLine>>>()
        for (const entryLine of props.entryLines) {
            let rows = map.get(entryLine.idAccount)
            if (!rows) {
                rows = []
                map.set(entryLine.idAccount, rows)
            }
            rows.push(entryLine)
        }
        return map
    }, [
        props.entryLines,
    ])

    const sortedAccounts = useMemo(
        () =>
            [
                ...props.accounts,
            ]
                .sort((a, b) => a.number.localeCompare(b.number))
                .filter((account) => entryLinesByAccountId.has(account.id)),
        [
            props.accounts,
            entryLinesByAccountId,
        ],
    )

    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: sortedAccounts.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => 120,
        measureElement: (element) => element.getBoundingClientRect().height,
        overscan: 3,
    })

    const virtualItems = virtualizer.getVirtualItems()

    const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0
    const paddingBottom =
        virtualItems.length > 0 ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end : 0

    return (
        <div
            ref={scrollContainerRef}
            className={css({
                width: "100%",
                maxHeight: "[70vh]",
                overflowY: "auto",
            })}
        >
            <Table.Root>
                <Table.Header.Root>
                    <Table.Header.Row>
                        <Table.Header.Cell>
                            <span
                                className={css({
                                    color: "neutral/75",
                                    fontSize: "sm",
                                })}
                            >
                                Compte
                            </span>
                        </Table.Header.Cell>
                        <Table.Header.Cell
                            className={css({
                                width: "[1%]",
                            })}
                            align="right"
                        >
                            <span
                                className={css({
                                    color: "neutral/75",
                                    fontSize: "sm",
                                    whiteSpace: "nowrap",
                                })}
                            >
                                Débit
                            </span>
                        </Table.Header.Cell>
                        <Table.Header.Cell
                            className={css({
                                width: "[1%]",
                            })}
                            align="right"
                        >
                            <span
                                className={css({
                                    color: "neutral/75",
                                    fontSize: "sm",
                                    whiteSpace: "nowrap",
                                })}
                            >
                                Crédit
                            </span>
                        </Table.Header.Cell>
                    </Table.Header.Row>
                </Table.Header.Root>
                <Table.Body.Root
                    className={css({
                        borderY: "1px solid token(colors.neutral/20)",
                        _last: {
                            borderBottom: "0",
                        },
                    })}
                >
                    <Table.Body.Row
                        className={css({
                            backgroundColor: "background",
                        })}
                    >
                        <Table.Body.Cell align="right">
                            <span
                                className={css({
                                    color: "neutral/50",
                                })}
                            >
                                Total
                            </span>
                        </Table.Body.Cell>
                        <Table.Body.Cell
                            className={css({
                                width: "[1%]",
                            })}
                            align="right"
                        >
                            <FormatPrice
                                price={accountsTotalDebit}
                                className={{
                                    fontWeight: "bold",
                                }}
                            />
                        </Table.Body.Cell>
                        <Table.Body.Cell
                            className={css({
                                width: "[1%]",
                            })}
                            align="right"
                        >
                            <FormatPrice
                                price={accountsTotalCredit}
                                className={{
                                    fontWeight: "bold",
                                }}
                            />
                        </Table.Body.Cell>
                    </Table.Body.Row>
                </Table.Body.Root>
                {sortedAccounts.length === 0 ? (
                    <Table.Body.Root
                        className={css({
                            borderBottom: "1px solid token(colors.neutral/10)",
                            _last: {
                                borderBottom: "0",
                            },
                        })}
                    >
                        <Table.Body.Row>
                            <Table.Body.Cell>
                                <FormatNull text="Aucune écriture" />
                            </Table.Body.Cell>
                        </Table.Body.Row>
                    </Table.Body.Root>
                ) : (
                    <Fragment>
                        {paddingTop > 0 && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={3}
                                        style={{
                                            height: `${paddingTop}px`,
                                            padding: 0,
                                            border: 0,
                                        }}
                                    />
                                </tr>
                            </tbody>
                        )}
                        {virtualItems.map((virtualItem) => {
                            const account = sortedAccounts[virtualItem.index]

                            return (
                                <LedgerAccountSection
                                    key={account.id}
                                    account={account}
                                    entryLines={entryLinesByAccountId.get(account.id) ?? []}
                                    entryById={entryById}
                                    virtualItem={virtualItem}
                                    measureElement={(element) => virtualizer.measureElement(element)}
                                />
                            )
                        })}
                        {paddingBottom > 0 && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={3}
                                        style={{
                                            height: `${paddingBottom}px`,
                                            padding: 0,
                                            border: 0,
                                        }}
                                    />
                                </tr>
                            </tbody>
                        )}
                    </Fragment>
                )}
            </Table.Root>
        </div>
    )
}
