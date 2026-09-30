import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { type ComponentProps, Fragment } from "react"
import type * as v from "valibot"
import { toRoman } from "../../../../../utilities/toRoman.ts"
import { getIncomeStatementChildren } from "../../yearSettings/incomeStatements/getIncomeStatementChildren.tsx"
import type { AccountTotals } from "../getAccountTotals.ts"
import { IncomeStatementReportRow } from "./IncomeStatementReportRow.tsx"

export function IncomeStatementReportItem(props: {
    idOrganization: v.InferOutput<typeof returnedSchemas.organization>["id"]
    idYear: v.InferOutput<typeof returnedSchemas.year>["id"]
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
    accountTotals: Map<string, AccountTotals>
    incomeStatement: v.InferOutput<typeof returnedSchemas.incomeStatement>
    incomeStatementChildren: Array<v.InferOutput<typeof returnedSchemas.incomeStatement>>
    level: number
    className?: ComponentProps<"div">["className"]
}) {
    const number = props.level === 0 ? toRoman(Number(props.incomeStatement.number)) : null

    const label = props.incomeStatement.label

    const isAmountDisplayed = props.incomeStatement.isComputed === true || props.incomeStatementChildren.length === 0

    const childIds = new Set(props.incomeStatementChildren.map((incomeStatement) => incomeStatement.id))

    let netAmount = 0
    for (const account of props.accounts) {
        const hasAccount = props.incomeStatement.id === account.idIncomeStatement
        const hasChildrenAccount = account.idIncomeStatement !== null && childIds.has(account.idIncomeStatement)
        if (!hasAccount && !hasChildrenAccount) continue

        const totals = props.accountTotals.get(account.id)
        if (totals === undefined) continue

        const accountBalance = totals.totalDebit - totals.totalCredit

        netAmount += Math.abs(accountBalance)
    }

    return (
        <Fragment>
            <IncomeStatementReportRow
                key={props.incomeStatement.id}
                level={props.level}
                number={number}
                label={label}
                amount={netAmount}
                isAmountDisplayed={isAmountDisplayed}
            />
            {(() => {
                const children: Array<React.JSX.Element> = []
                for (const incomeStatement of props.incomeStatementChildren) {
                    if (incomeStatement.idIncomeStatementParent !== props.incomeStatement.id) continue
                    const incomeStatementChildren = getIncomeStatementChildren({
                        incomeStatement: incomeStatement,
                        incomeStatements: props.incomeStatementChildren,
                    })

                    children.push(
                        <IncomeStatementReportItem
                            key={incomeStatement.id}
                            idOrganization={props.idOrganization}
                            idYear={props.idYear}
                            accounts={props.accounts}
                            accountTotals={props.accountTotals}
                            incomeStatement={incomeStatement}
                            incomeStatementChildren={incomeStatementChildren}
                            level={props.level + 1}
                        />,
                    )
                }
                return children
            })()}
        </Fragment>
    )
}
