import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatNull } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useMemo } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { Table } from "../../../../../../components/layouts/table/table.tsx"
import { getBalanceSheetChildren } from "../../../yearSettings/balanceSheets/getBalanceSheetChildren.tsx"
import { getAccountTotals } from "../../getAccountTotals.ts"
import { BalanceSheetAssetsReportItem } from "./BalanceSheetAssetsReportItem.tsx"
import { BalanceSheetAssetsReportRow } from "./BalanceSheetAssetsReportRow.tsx"

export function BalanceSheetAssetsReportTable(props: {
    balanceSheets: Array<v.InferOutput<typeof returnedSchemas.balanceSheet>>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
}) {
    const accountTotals = useMemo(
        () => getAccountTotals(props.entryLines),
        [
            props.entryLines,
        ],
    )

    let grossTotalAmount = 0
    let amortizationTotalAmount = 0
    props.accounts.forEach((account) => {
        const totals = accountTotals.get(account.id)
        const accountTotalDebit = totals?.totalDebit ?? 0
        const accountTotalCredit = totals?.totalCredit ?? 0

        const accountBalance = accountTotalDebit - accountTotalCredit

        if (accountBalance < 0 && account.balanceSheetAssetFlow === "debit") {
            return
        }

        if (accountBalance > 0 && account.balanceSheetAssetFlow === "credit") {
            return
        }

        if (account.balanceSheetAssetColumn === "gross") {
            if (account.balanceSheetAssetFlow === "debit") {
                grossTotalAmount += Math.abs(accountBalance)
            }
            if (account.balanceSheetAssetFlow === "credit") {
                grossTotalAmount += -Math.abs(accountBalance)
            }
        }
        if (account.balanceSheetAssetColumn === "amortization") {
            if (account.balanceSheetAssetFlow === "debit") {
                amortizationTotalAmount += Math.abs(accountBalance)
            }
            if (account.balanceSheetAssetFlow === "credit") {
                amortizationTotalAmount += -Math.abs(accountBalance)
            }
        }
    })

    return (
        <div
            className={css({
                width: "100%",
                maxHeight: "[70vh]",
                overflowY: "auto",
            })}
        >
            <Table.Root>
                <Table.Header.Root>
                    <Table.Header.Row>
                        <Table.Header.Cell />
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
                                })}
                            >
                                Brut
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
                                Amort. & Dépré.
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
                                })}
                            >
                                Net
                            </span>
                        </Table.Header.Cell>
                    </Table.Header.Row>
                </Table.Header.Root>
                <Table.Body.Root>
                    {props.balanceSheets.length === 0 ? (
                        <Table.Body.Root
                            className={css({
                                borderBottom: "1px solid",
                                borderBottomColor: "neutral/10",
                                _last: {
                                    borderBottom: "0",
                                },
                            })}
                        >
                            <Table.Body.Row>
                                <Table.Body.Cell>
                                    <FormatNull />
                                </Table.Body.Cell>
                            </Table.Body.Row>
                        </Table.Body.Root>
                    ) : (
                        <Fragment>
                            {props.balanceSheets
                                .filter((balanceSheet) => balanceSheet.idBalanceSheetParent === null)
                                .sort((a, b) => Number(a.number) - Number(b.number))
                                .map((balanceSheet) => {
                                    const balanceSheetChildren = getBalanceSheetChildren({
                                        balanceSheet: balanceSheet,
                                        balanceSheets: props.balanceSheets,
                                    })

                                    return (
                                        <BalanceSheetAssetsReportItem
                                            key={balanceSheet.id}
                                            idOrganization={balanceSheet.idOrganization}
                                            idYear={balanceSheet.idYear}
                                            accounts={props.accounts}
                                            accountTotals={accountTotals}
                                            balanceSheet={balanceSheet}
                                            balanceSheetChildren={balanceSheetChildren}
                                            level={0}
                                        />
                                    )
                                })}
                            <BalanceSheetAssetsReportRow
                                level={0}
                                number={" "}
                                label={"Total"}
                                grossAmount={grossTotalAmount}
                                amortizationAmount={amortizationTotalAmount}
                                isAmountDisplayed={true}
                            />
                        </Fragment>
                    )}
                </Table.Body.Root>
            </Table.Root>
        </div>
    )
}
