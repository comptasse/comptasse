import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Fragment, useMemo, useRef } from "react"
import type * as v from "valibot"
import { Table } from "../../../../../components/layouts/table/table.tsx"

type Account = v.InferOutput<typeof returnedSchemas.account>

type AccountTotals = {
    totalDebit: number
    totalCredit: number
    balanceDebit: number
    balanceCredit: number
}

type BalanceTotals = {
    debit: number
    credit: number
    balanceDebit: number
    balanceCredit: number
}

function BalanceReportTableHeader({ totals }: { totals: BalanceTotals }) {
    return (
        <>
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
                            Solde débiteur
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
                            Solde créditeur
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
                            price={totals.debit}
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
                            price={totals.credit}
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
                            price={totals.balanceDebit}
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
                            price={totals.balanceCredit}
                            className={{
                                fontWeight: "bold",
                            }}
                        />
                    </Table.Body.Cell>
                </Table.Body.Row>
            </Table.Body.Root>
        </>
    )
}

function BalanceAccountRow({
    account,
    data,
    virtualItem,
    measureElement,
}: {
    account: Account
    data: AccountTotals | undefined
    virtualItem: ReturnType<ReturnType<typeof useVirtualizer>["getVirtualItems"]>[number]
    measureElement: (element: Element | null) => void
}) {
    return (
        <Table.Body.Root
            data-index={virtualItem.index}
            ref={measureElement}
        >
            <Table.Body.Row
                className={css({
                    borderColor: "neutral/5",
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
                    <FormatPrice price={data?.totalDebit ?? 0} />
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice price={data?.totalCredit ?? 0} />
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice price={data?.balanceDebit ?? 0} />
                </Table.Body.Cell>
                <Table.Body.Cell
                    className={css({
                        width: "[1%]",
                    })}
                    align="right"
                >
                    <FormatPrice price={data?.balanceCredit ?? 0} />
                </Table.Body.Cell>
            </Table.Body.Row>
        </Table.Body.Root>
    )
}

export function BalanceReportTable(props: {
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const sortedAccounts = useMemo(
        () => props.accounts.toSorted((a, b) => a.number.localeCompare(b.number)),
        [
            props.accounts,
        ],
    )

    const entryLinesByAccount = useMemo(() => {
        const map = new Map<string, Array<v.InferOutput<typeof returnedSchemas.entryLine>>>()
        for (const entryLine of props.entryLines) {
            const existing = map.get(entryLine.idAccount)
            if (existing) {
                existing.push(entryLine)
            } else {
                map.set(entryLine.idAccount, [
                    entryLine,
                ])
            }
        }
        return map
    }, [
        props.entryLines,
    ])

    const accountsWithRows = useMemo(
        () => sortedAccounts.filter((account) => (entryLinesByAccount.get(account.id)?.length ?? 0) > 0),
        [
            sortedAccounts,
            entryLinesByAccount,
        ],
    )

    const accountData = useMemo(() => {
        let accountsTotalDebit = 0
        let accountsTotalCredit = 0
        let accountsTotalBalanceDebit = 0
        let accountsTotalBalanceCredit = 0

        const perAccount = new Map<
            string,
            {
                totalDebit: number
                totalCredit: number
                balanceDebit: number
                balanceCredit: number
            }
        >()

        for (const account of props.accounts) {
            const rows = entryLinesByAccount.get(account.id) ?? []
            let accountTotalDebit = 0
            let accountTotalCredit = 0

            for (const entryLine of rows) {
                accountTotalDebit += Number(entryLine.debit)
                accountTotalCredit += Number(entryLine.credit)
            }

            accountsTotalDebit += accountTotalDebit
            accountsTotalCredit += accountTotalCredit

            const algebricBalance = accountTotalDebit - accountTotalCredit

            const balanceDebit = algebricBalance > 0 ? Math.abs(algebricBalance) : 0
            const balanceCredit = algebricBalance < 0 ? Math.abs(algebricBalance) : 0

            accountsTotalBalanceDebit += balanceDebit
            accountsTotalBalanceCredit += balanceCredit

            if (rows.length > 0) {
                perAccount.set(account.id, {
                    totalDebit: accountTotalDebit,
                    totalCredit: accountTotalCredit,
                    balanceDebit,
                    balanceCredit,
                })
            }
        }

        return {
            totals: {
                debit: accountsTotalDebit,
                credit: accountsTotalCredit,
                balanceDebit: accountsTotalBalanceDebit,
                balanceCredit: accountsTotalBalanceCredit,
            },
            perAccount,
        }
    }, [
        props.accounts,
        entryLinesByAccount,
    ])

    const virtualizer = useVirtualizer({
        count: accountsWithRows.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: () => 45,
        measureElement: (element) => element.getBoundingClientRect().height,
        overscan: 5,
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
                <BalanceReportTableHeader totals={accountData.totals} />
                {accountsWithRows.length === 0 ? (
                    <Table.Body.Root>
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
                            const account = accountsWithRows[virtualItem.index]
                            const data = accountData.perAccount.get(account.id)

                            return (
                                <BalanceAccountRow
                                    key={account.id}
                                    account={account}
                                    data={data}
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
