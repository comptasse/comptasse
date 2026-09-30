import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { type ComponentProps, Fragment } from "react"
import type * as v from "valibot"
import { toRoman } from "../../../../../../utilities/toRoman.ts"
import { getBalanceSheetChildren } from "../../../yearSettings/balanceSheets/getBalanceSheetChildren.tsx"
import type { AccountTotals } from "../../getAccountTotals.ts"
import { BalanceSheetLiabilitiesReportRow } from "./BalanceSheetLiabilitiesReportRow.tsx"

export function BalanceSheetLiabilitiesReportItem(props: {
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

    let netTotalAmount = 0
    for (const account of props.accounts) {
        const hasAccount = account.idBalanceSheetLiability === props.balanceSheet.id
        const hasChildrenAccount =
            account.idBalanceSheetLiability !== null && childIds.has(account.idBalanceSheetLiability)
        if (!hasAccount && !hasChildrenAccount) continue

        const totals = props.accountTotals.get(account.id)
        const accountTotalDebit = totals?.totalDebit ?? 0
        const accountTotalCredit = totals?.totalCredit ?? 0

        const accountBalance = accountTotalCredit - accountTotalDebit

        if (accountBalance > 0 && account.balanceSheetLiabilityFlow === "debit") {
            continue
        }

        if (accountBalance < 0 && account.balanceSheetLiabilityFlow === "credit") {
            continue
        }

        if (account.balanceSheetLiabilityColumn === "net") {
            if (account.balanceSheetLiabilityFlow === "debit") {
                netTotalAmount += accountBalance
            }
            if (account.balanceSheetLiabilityFlow === "credit") {
                netTotalAmount += accountBalance
            }
        }
    }

    return (
        <Fragment>
            <BalanceSheetLiabilitiesReportRow
                key={props.balanceSheet.id}
                level={props.level}
                number={number}
                label={label}
                netAmount={netTotalAmount}
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
                        <BalanceSheetLiabilitiesReportItem
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
