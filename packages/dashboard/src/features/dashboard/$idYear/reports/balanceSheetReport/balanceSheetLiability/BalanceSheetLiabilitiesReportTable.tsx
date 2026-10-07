import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatNull } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { useMemo } from "react"
import { Fragment } from "react/jsx-runtime"
import type * as v from "valibot"
import { Table } from "../../../../../../components/layouts/table/table.tsx"
import { getBalanceSheetChildren } from "../../../yearSettings/balanceSheets/getBalanceSheetChildren.tsx"
import { getAccountTotals } from "../../getAccountTotals.ts"
import { BalanceSheetLiabilitiesReportItem } from "./BalanceSheetLiabilitiesReportItem.tsx"
import { BalanceSheetLiabilitiesReportRow } from "./BalanceSheetLiabilitiesReportRow.tsx"

export function BalanceSheetLiabilitiesReportTable(props: {
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

    let netTotalAmount = 0
    props.accounts.forEach((account) => {
        const totals = accountTotals.get(account.id)
        const accountTotalDebit = totals?.totalDebit ?? 0
        const accountTotalCredit = totals?.totalCredit ?? 0

        const accountBalance = accountTotalDebit - accountTotalCredit

        if (accountBalance < 0 && account.balanceSheetLiabilityFlow === "debit") {
            return
        }

        if (accountBalance > 0 && account.balanceSheetLiabilityFlow === "credit") {
            return
        }

        if (account.balanceSheetLiabilityColumn === "net") {
            if (account.balanceSheetLiabilityFlow === "debit") {
                netTotalAmount += -Math.abs(accountBalance)
            }
            if (account.balanceSheetLiabilityFlow === "credit") {
                netTotalAmount += Math.abs(accountBalance)
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
                                        <BalanceSheetLiabilitiesReportItem
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
                            <BalanceSheetLiabilitiesReportRow
                                level={0}
                                number={" "}
                                label={"Total"}
                                netAmount={netTotalAmount}
                                isAmountDisplayed={true}
                            />
                        </Fragment>
                    )}
                </Table.Body.Root>
            </Table.Root>
        </div>
    )
}
