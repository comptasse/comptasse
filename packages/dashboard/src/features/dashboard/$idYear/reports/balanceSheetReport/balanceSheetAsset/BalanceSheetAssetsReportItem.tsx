import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { type ComponentProps, Fragment } from "react"
import type * as v from "valibot"
import { toRoman } from "../../../../../../utilities/toRoman.ts"
import { getBalanceSheetChildren } from "../../../yearSettings/balanceSheets/getBalanceSheetChildren.tsx"
import type { AccountTotals } from "../../getAccountTotals.ts"
import { BalanceSheetAssetsReportRow } from "./BalanceSheetAssetsReportRow.tsx"

export function BalanceSheetAssetsReportItem(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
    accountTotals: Map<string, AccountTotals>
    balanceSheet: v.InferOutput<typeof returnedSchemas.balanceSheet>
    balanceSheetChildren: Array<v.InferOutput<typeof returnedSchemas.balanceSheet>>
    level: number
    className?: ComponentProps<"div">["className"]
}) {
    const number = props.level === 0 ? toRoman(Number(props.balanceSheet.number)) : null

    const label = props.balanceSheet.label

    const isAmountDisplayed = props.balanceSheet.isComputed === true || props.balanceSheetChildren.length === 0

    const childIds = new Set(props.balanceSheetChildren.map((balanceSheet) => balanceSheet.id))

    let grossTotalAmount = 0
    let amortizationTotalAmount = 0
    for (const account of props.accounts) {
        const hasAccount = account.idBalanceSheetAsset === props.balanceSheet.id
        const hasChildrenAccount = account.idBalanceSheetAsset !== null && childIds.has(account.idBalanceSheetAsset)
        if (!hasAccount && !hasChildrenAccount) continue

        const totals = props.accountTotals.get(account.id)
        const accountTotalDebit = totals?.totalDebit ?? 0
        const accountTotalCredit = totals?.totalCredit ?? 0

        const accountBalance = accountTotalDebit - accountTotalCredit

        if (accountBalance < 0 && account.balanceSheetAssetFlow === "debit") {
            continue
        }

        if (accountBalance > 0 && account.balanceSheetAssetFlow === "credit") {
            continue
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
    }

    return (
        <Fragment>
            <BalanceSheetAssetsReportRow
                key={props.balanceSheet.id}
                level={props.level}
                number={number}
                label={label}
                grossAmount={grossTotalAmount}
                amortizationAmount={amortizationTotalAmount}
                isAmountDisplayed={isAmountDisplayed}
            />
            {(() => {
                const children: Array<React.JSX.Element> = []
                for (const balanceSheet of props.balanceSheetChildren) {
                    if (balanceSheet.idBalanceSheetParent !== props.balanceSheet.id) continue
                    const balanceSheetChildren = getBalanceSheetChildren({
                        balanceSheet: balanceSheet,
                        balanceSheets: props.balanceSheetChildren,
                    })

                    children.push(
                        <BalanceSheetAssetsReportItem
                            key={balanceSheet.id}
                            idOrganization={props.idOrganization}
                            idYear={props.idYear}
                            accounts={props.accounts}
                            accountTotals={props.accountTotals}
                            balanceSheet={balanceSheet}
                            balanceSheetChildren={balanceSheetChildren}
                            level={props.level + 1}
                        />,
                    )
                }
                return children
            })()}
        </Fragment>
    )
}
