import { FormatPrice, FormatText } from "@comptasse/ui"
import { cn, css } from "@comptasse/ui/utilities/cn.js"
import { Table } from "../../../../../components/layouts/table/table.tsx"

export function IncomeStatementReportRow(props: {
    level: number
    number: string | null
    label: string
    amount: number
    isAmountDisplayed: boolean
}) {
    return (
        <Table.Body.Row
            className={cn(
                css({
                    contentVisibility: "auto",
                    containIntrinsicSize: "auto 2.5rem",
                }),
                props.number
                    ? css({
                          backgroundColor: "neutral/5",
                      })
                    : "",
            )}
        >
            <Table.Body.Cell
                style={{
                    paddingLeft: `${props.level * 16 + 8}px`,
                }}
            >
                <FormatText
                    className={css.raw(
                        {
                            whiteSpace: "normal",
                        },
                        props.number
                            ? {
                                  fontWeight: "bold",
                              }
                            : undefined,
                    )}
                >
                    {props.number} {props.label}
                </FormatText>
            </Table.Body.Cell>
            <Table.Body.Cell
                className={css({
                    width: "[1%]",
                })}
                align="right"
            >
                {props.isAmountDisplayed === true ? <FormatPrice price={props.amount} /> : null}
            </Table.Body.Cell>
        </Table.Body.Row>
    )
}
