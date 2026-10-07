import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { FormatNull, FormatPrice, FormatText } from "@comptasse/ui"
import { cn, css } from "@comptasse/ui/utilities/cn.js"
import { useMemo } from "react"
import type * as v from "valibot"
import { Table } from "../../../../../components/layouts/table/table.tsx"
import { toRoman } from "../../../../../utilities/toRoman.ts"
import { getIncomeStatementChildren } from "../../yearSettings/incomeStatements/getIncomeStatementChildren.tsx"
import { getAccountTotals } from "../getAccountTotals.ts"
import { IncomeStatementReportItem } from "./IncomeStatementReportItem.tsx"

export function IncomeStatementsReportTable(props: {
    incomeStatements: Array<v.InferOutput<typeof returnedSchemas.incomeStatement>>
    computations: Array<v.InferOutput<typeof returnedSchemas.computation>>
    computationIncomeStatements: Array<v.InferOutput<typeof returnedSchemas.computationIncomeStatement>>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
}) {
    const incomeStatementById = useMemo(
        () =>
            new Map(
                props.incomeStatements.map((is) => [
                    is.id,
                    is,
                ]),
            ),
        [
            props.incomeStatements,
        ],
    )

    const accountTotals = useMemo(
        () => getAccountTotals(props.entryLines),
        [
            props.entryLines,
        ],
    )

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
                    {props.incomeStatements
                        .filter((incomeStatement) => incomeStatement.idIncomeStatementParent === null)
                        .sort((a, b) => Number(a.number) - Number(b.number))
                        .map((incomeStatement) => {
                            const incomeStatementChildren = getIncomeStatementChildren({
                                incomeStatement: incomeStatement,
                                incomeStatements: props.incomeStatements,
                            })

                            return (
                                <IncomeStatementReportItem
                                    key={incomeStatement.id}
                                    idOrganization={incomeStatement.idOrganization}
                                    idYear={incomeStatement.idYear}
                                    accounts={props.accounts}
                                    accountTotals={accountTotals}
                                    incomeStatement={incomeStatement}
                                    incomeStatementChildren={incomeStatementChildren}
                                    level={0}
                                />
                            )
                        })}
                </Table.Body.Root>
                <Table.Body.Root>
                    {props.computations.length === 0 ? (
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
                                    <FormatNull />
                                </Table.Body.Cell>
                            </Table.Body.Row>
                        </Table.Body.Root>
                    ) : (
                        props.computations.map((computation, index) => {
                            let computationAmount = 0
                            for (const computationIncomeStatement of props.computationIncomeStatements) {
                                if (computationIncomeStatement.idComputation !== computation.id) continue
                                let incomeStatementAmount = 0
                                const foundIncomeStatement = incomeStatementById.get(
                                    computationIncomeStatement.idIncomeStatement,
                                )
                                if (foundIncomeStatement === undefined) continue
                                const incomeStatementChildren = getIncomeStatementChildren({
                                    incomeStatement: foundIncomeStatement,
                                    incomeStatements: props.incomeStatements,
                                })
                                for (const account of props.accounts) {
                                    const hasAccount =
                                        account.idIncomeStatement === computationIncomeStatement.idIncomeStatement
                                    const hasChildrenAccount = incomeStatementChildren.some(
                                        (incomeStatement) => incomeStatement.id === account.idIncomeStatement,
                                    )
                                    if (!hasAccount && !hasChildrenAccount) continue
                                    const totals = accountTotals.get(account.id)
                                    if (totals === undefined) continue
                                    incomeStatementAmount += totals.totalDebit - totals.totalCredit
                                }

                                if (computationIncomeStatement.operation === "plus") {
                                    computationAmount += Math.abs(incomeStatementAmount)
                                }
                                if (computationIncomeStatement.operation === "minus") {
                                    computationAmount += -Math.abs(incomeStatementAmount)
                                }
                            }

                            // .sort((a, b) => {
                            //     if (!a.incomeStatement || !b.incomeStatement) return 0
                            //     return (a.incomeStatement.number - b.incomeStatement.number)
                            // })

                            const computationIncomeStatementsLabelParts: string[] = []
                            let computationIncomeStatementIndex = 0
                            for (const computationIncomeStatement of props.computationIncomeStatements) {
                                if (computationIncomeStatement.idComputation !== computation.id) continue
                                const incomeStatement = incomeStatementById.get(
                                    computationIncomeStatement.idIncomeStatement,
                                )
                                if (incomeStatement === undefined) {
                                    computationIncomeStatementIndex++
                                    continue
                                }
                                const romanNumber = toRoman(Number(incomeStatement.number))
                                if (computationIncomeStatement.operation === "plus") {
                                    computationIncomeStatementsLabelParts.push(
                                        computationIncomeStatementIndex === 0 ? `${romanNumber}` : `+${romanNumber}`,
                                    )
                                } else if (computationIncomeStatement.operation === "minus") {
                                    computationIncomeStatementsLabelParts.push(`-${romanNumber}`)
                                } else {
                                    computationIncomeStatementsLabelParts.push("")
                                }
                                computationIncomeStatementIndex++
                            }
                            const computationIncomeStatementsLabel = computationIncomeStatementsLabelParts.join("")

                            return (
                                <Table.Body.Row
                                    key={computation.id}
                                    className={cn(
                                        css({}),
                                        index === 0
                                            ? css({
                                                  borderTop: "1px solid token(colors.neutral/25)",
                                                  borderBottomColor: "neutral/5",
                                              })
                                            : "",
                                    )}
                                >
                                    <Table.Body.Cell align="right">
                                        <div
                                            className={css({
                                                width: "100%",
                                                display: "flex",
                                                justifyContent: "end",
                                                gap: "0.5rem",
                                            })}
                                        >
                                            <FormatText
                                                className={{
                                                    whiteSpace: "normal",
                                                    textAlign: "right",
                                                }}
                                            >
                                                {computation.label}
                                            </FormatText>
                                            <FormatText
                                                className={{
                                                    whiteSpace: "normal",
                                                    textAlign: "right",
                                                    color: "neutral/50",
                                                }}
                                            >
                                                {`(${computationIncomeStatementsLabel})`}
                                            </FormatText>
                                        </div>
                                    </Table.Body.Cell>
                                    <Table.Body.Cell
                                        className={css({
                                            width: "[1%]",
                                        })}
                                        align="right"
                                    >
                                        <FormatPrice price={computationAmount} />
                                    </Table.Body.Cell>
                                </Table.Body.Row>
                            )
                        })
                    )}
                </Table.Body.Root>
            </Table.Root>
        </div>
    )
}
