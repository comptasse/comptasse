import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatDate, FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { cn, css } from "@comptasse/ui/utilities/cn.js"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Fragment, useMemo, useRef } from "react"
import type * as v from "valibot"
import { Table } from "../../../../../components/layouts/table/table.tsx"
import { compareAmounts } from "../../../../../utilities/compareAmounts.ts"

type Entry = v.InferOutput<typeof returnedSchemas.entry>
type EntryLine = v.InferOutput<typeof returnedSchemas.entryLine>
type Account = v.InferOutput<typeof returnedSchemas.account>

function JournalEntrySection({
    entry,
    entryLines,
    accounts,
    virtualItem,
    measureElement,
}: {
    entry: Entry
    entryLines: Array<EntryLine>
    accounts: Map<string, Account>
    virtualItem: ReturnType<ReturnType<typeof useVirtualizer>["getVirtualItems"]>[number]
    measureElement: (element: Element | null) => void
}) {
    const sortedEntryLines = [
        ...entryLines,
    ].sort((a, b) => (a.lastUpdatedAt ?? "").localeCompare(b.lastUpdatedAt ?? ""))

    const entryTotalDebit = sortedEntryLines.reduce((acc, entryLine) => acc + Number(entryLine.debit), 0)
    const entryTotalCredit = sortedEntryLines.reduce((acc, entryLine) => acc + Number(entryLine.credit), 0)

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
                className={cn(
                    css({
                        borderColor: "neutral/10",
                        backgroundColor: "background",
                    }),
                )}
            >
                <Table.Body.Cell>
                    <FormatDate
                        className={{
                            fontStyle: "italic",
                        }}
                        date={entry.date}
                    />
                </Table.Body.Cell>
                <Table.Body.Cell colSpan={2}>
                    <FormatText wrap={true}>{entry.label}</FormatText>
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice
                        price={entryTotalDebit}
                        className={css.raw(
                            {
                                fontWeight: "bold",
                            },
                            compareAmounts({
                                a: entryTotalDebit,
                                b: entryTotalCredit,
                            })
                                ? undefined
                                : {
                                      color: "error",
                                  },
                        )}
                    />
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice
                        price={entryTotalCredit}
                        className={css.raw(
                            {
                                fontWeight: "bold",
                            },
                            compareAmounts({
                                a: entryTotalDebit,
                                b: entryTotalCredit,
                            })
                                ? {
                                      color: "neutral",
                                  }
                                : {
                                      color: "error",
                                  },
                        )}
                    />
                </Table.Body.Cell>
            </Table.Body.Row>
            {/* biome-ignore lint/complexity/noUselessFragments: Fragment needed for TypeScript type compatibility with Table.Body.Root children */}
            <Fragment>
                {sortedEntryLines.map((entryLine) => {
                    const account = accounts.get(entryLine.idAccount)

                    return (
                        <Table.Body.Row key={entryLine.id}>
                            <Table.Body.Cell />
                            <Table.Body.Cell />
                            <Table.Body.Cell>
                                <div
                                    className={css({
                                        display: "flex",
                                        justifyContent: "start",
                                        alignItems: "start",
                                        gap: "0.5rem",
                                    })}
                                >
                                    {account && (
                                        <Fragment>
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
                                        </Fragment>
                                    )}
                                </div>
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

export function JournalReportTable(props: {
    entries: Array<v.InferOutput<typeof returnedSchemas.entry>>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Map<string, v.InferOutput<typeof returnedSchemas.account>>
}) {
    const entryLines = props.entryLines
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const entryLinesByEntryId = useMemo(() => {
        const map = new Map<string, Array<EntryLine>>()
        for (const entryLine of entryLines) {
            const arr = map.get(entryLine.idEntry)
            if (arr) arr.push(entryLine)
            else
                map.set(entryLine.idEntry, [
                    entryLine,
                ])
        }
        return map
    }, [
        entryLines,
    ])

    const totalDebit = entryLines.reduce((acc, entryLine) => acc + Number(entryLine.debit), 0)
    const totalCredit = entryLines.reduce((acc, entryLine) => acc + Number(entryLine.credit), 0)

    const virtualizer = useVirtualizer({
        count: props.entries.length,
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
                                Date
                            </span>
                        </Table.Header.Cell>
                        <Table.Header.Cell>
                            <span
                                className={css({
                                    color: "neutral/75",
                                    fontSize: "sm",
                                })}
                            >
                                Libellé
                            </span>
                        </Table.Header.Cell>
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
                        borderY: "1px solid token(colors.neutral/10)",
                        _last: {
                            borderBottom: "0",
                        },
                    })}
                >
                    <Table.Body.Row>
                        <Table.Body.Cell colSpan={2} />
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
                                price={totalDebit}
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
                                price={totalCredit}
                                className={{
                                    fontWeight: "bold",
                                }}
                            />
                        </Table.Body.Cell>
                    </Table.Body.Row>
                </Table.Body.Root>
                {props.entries.length === 0 ? (
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
                                        colSpan={5}
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
                            const entry = props.entries[virtualItem.index]

                            return (
                                <JournalEntrySection
                                    key={entry.id}
                                    entry={entry}
                                    entryLines={entryLinesByEntryId.get(entry.id) ?? []}
                                    accounts={props.accounts}
                                    virtualItem={virtualItem}
                                    measureElement={(element) => virtualizer.measureElement(element)}
                                />
                            )
                        })}
                        {paddingBottom > 0 && (
                            <tbody>
                                <tr>
                                    <td
                                        colSpan={5}
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
