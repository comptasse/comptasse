import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
// react-doctor-disable-next-line react-doctor/prefer-dynamic-import
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import type * as v from "valibot"
import { toRoman } from "../../../../../utilities/toRoman.ts"
import { getIncomeStatementChildren } from "../../yearSettings/incomeStatements/getIncomeStatementChildren.tsx"

function fmt(value: number): string {
    return value.toFixed(2)
}

type IncomeStatement = v.InferOutput<typeof returnedSchemas.incomeStatement>
type Computation = v.InferOutput<typeof returnedSchemas.computation>
type ComputationIncomeStatement = v.InferOutput<typeof returnedSchemas.computationIncomeStatement>
type EntryLine = v.InferOutput<typeof returnedSchemas.entryLine>
type Account = v.InferOutput<typeof returnedSchemas.account>

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 9,
        fontFamily: "Helvetica",
        color: "#111111",
    },
    title: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#cccccc",
        paddingBottom: 4,
        marginBottom: 2,
    },
    headerText: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#555555",
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#eeeeee",
        paddingVertical: 3,
    },
    sectionRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: "#dddddd",
        paddingVertical: 3,
        backgroundColor: "#f5f5f5",
    },
    computationHeaderRow: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#aaaaaa",
        borderBottomWidth: 0.5,
        borderBottomColor: "#eeeeee",
        paddingVertical: 3,
        marginTop: 8,
    },
    labelCell: {
        flex: 1,
    },
    amountCell: {
        width: 80,
        textAlign: "right",
    },
    boldText: {
        fontFamily: "Helvetica-Bold",
    },
    mutedText: {
        color: "#888888",
    },
})

function computeIncomeStatementAmount(
    incomeStatement: IncomeStatement,
    allIncomeStatements: IncomeStatement[],
    accounts: Account[],
    entryLines: EntryLine[],
): number {
    const children = getIncomeStatementChildren({
        incomeStatement,
        incomeStatements: allIncomeStatements,
    })
    let netAmount = 0
    for (const account of accounts) {
        const hasAccount = account.idIncomeStatement === incomeStatement.id
        const hasChildrenAccount = children.some((is) => is.id === account.idIncomeStatement)
        if (!hasAccount && !hasChildrenAccount) continue

        let debit = 0
        let credit = 0
        for (const el of entryLines) {
            if (el.idAccount !== account.id) continue
            debit += Number(el.debit)
            credit += Number(el.credit)
        }
        netAmount += Math.abs(debit - credit)
    }
    return netAmount
}

function IncomeStatementPdfRows({
    incomeStatements,
    allIncomeStatements,
    accounts,
    entryLines,
    level,
}: {
    incomeStatements: IncomeStatement[]
    allIncomeStatements: IncomeStatement[]
    accounts: Account[]
    entryLines: EntryLine[]
    level: number
}) {
    return (
        <>
            {incomeStatements.map((is) => {
                const directChildren = getIncomeStatementChildren({
                    incomeStatement: is,
                    incomeStatements: allIncomeStatements,
                }).filter((child) => child.idIncomeStatementParent === is.id)

                const number = level === 0 ? toRoman(Number(is.number)) : null
                const isAmountDisplayed = is.isComputed === true || directChildren.length === 0
                const amount = computeIncomeStatementAmount(is, allIncomeStatements, accounts, entryLines)

                return (
                    <View key={is.id}>
                        <View style={number ? styles.sectionRow : styles.row}>
                            <View
                                style={[
                                    styles.labelCell,
                                    {
                                        paddingLeft: level * 12,
                                    },
                                ]}
                            >
                                <Text style={number ? styles.boldText : {}}>
                                    {number ? `${number}  ` : ""}
                                    {is.label}
                                </Text>
                            </View>
                            <View style={styles.amountCell}>
                                {isAmountDisplayed ? <Text>{fmt(amount)}</Text> : null}
                            </View>
                        </View>
                        {directChildren.length > 0 ? (
                            <IncomeStatementPdfRows
                                incomeStatements={directChildren}
                                allIncomeStatements={allIncomeStatements}
                                accounts={accounts}
                                entryLines={entryLines}
                                level={level + 1}
                            />
                        ) : null}
                    </View>
                )
            })}
        </>
    )
}

export function IncomeStatementReportPdf(props: {
    incomeStatements: IncomeStatement[]
    computations: Computation[]
    computationIncomeStatements: ComputationIncomeStatement[]
    entryLines: EntryLine[]
    accounts: Account[]
}) {
    const rootIncomeStatements = props.incomeStatements
        .filter((is) => is.idIncomeStatementParent === null)
        .sort((a, b) => Number(a.number) - Number(b.number))
    const incomeStatementById = new Map(
        props.incomeStatements.map((is) => [
            is.id,
            is,
        ]),
    )

    return (
        <Document>
            <Page
                size="A4"
                style={styles.page}
            >
                <Text style={styles.title}>Compte de résultat</Text>
                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.labelCell}>
                        <Text style={styles.headerText}>Intitulé</Text>
                    </View>
                    <View style={styles.amountCell}>
                        <Text style={styles.headerText}>Net</Text>
                    </View>
                </View>
                {/* Income statement rows */}
                <IncomeStatementPdfRows
                    incomeStatements={rootIncomeStatements}
                    allIncomeStatements={props.incomeStatements}
                    accounts={props.accounts}
                    entryLines={props.entryLines}
                    level={0}
                />
                {/* Computations (SIG) */}
                {props.computations.length > 0 ? (
                    <>
                        <View style={styles.computationHeaderRow}>
                            <View style={styles.labelCell}>
                                <Text style={styles.boldText}>Soldes intermédiaires de gestion</Text>
                            </View>
                            <View style={styles.amountCell} />
                        </View>
                        {props.computations.map((computation) => {
                            let computationAmount = 0
                            for (const cis of props.computationIncomeStatements) {
                                if (cis.idComputation !== computation.id) continue
                                let incomeStatementAmount = 0
                                const foundIS = incomeStatementById.get(cis.idIncomeStatement)
                                if (!foundIS) continue
                                const children = getIncomeStatementChildren({
                                    incomeStatement: foundIS,
                                    incomeStatements: props.incomeStatements,
                                })
                                for (const account of props.accounts) {
                                    const hasAccount = account.idIncomeStatement === cis.idIncomeStatement
                                    const hasChildrenAccount = children.some(
                                        (is) => is.id === account.idIncomeStatement,
                                    )
                                    if (!hasAccount && !hasChildrenAccount) continue
                                    for (const el of props.entryLines) {
                                        if (el.idAccount !== account.id) continue
                                        incomeStatementAmount += Number(el.debit) - Number(el.credit)
                                    }
                                }
                                if (cis.operation === "plus") computationAmount += Math.abs(incomeStatementAmount)
                                if (cis.operation === "minus") computationAmount += -Math.abs(incomeStatementAmount)
                            }

                            const formulaLabelParts: string[] = []
                            let formulaIndex = 0
                            for (const cis of props.computationIncomeStatements) {
                                if (cis.idComputation !== computation.id) continue
                                const is = incomeStatementById.get(cis.idIncomeStatement)
                                if (!is) {
                                    formulaIndex++
                                    continue
                                }
                                const roman = toRoman(Number(is.number))
                                if (cis.operation === "plus") {
                                    formulaLabelParts.push(formulaIndex === 0 ? roman : `+${roman}`)
                                } else if (cis.operation === "minus") {
                                    formulaLabelParts.push(`-${roman}`)
                                } else {
                                    formulaLabelParts.push("")
                                }
                                formulaIndex++
                            }
                            const formulaLabel = formulaLabelParts.join("")

                            return (
                                <View
                                    key={computation.id}
                                    style={styles.row}
                                >
                                    <View
                                        style={[
                                            styles.labelCell,
                                            {
                                                flexDirection: "row",
                                                justifyContent: "flex-end",
                                                gap: 4,
                                            },
                                        ]}
                                    >
                                        <Text>{computation.label}</Text>
                                        <Text style={styles.mutedText}> ({formulaLabel})</Text>
                                    </View>
                                    <View style={styles.amountCell}>
                                        <Text>{fmt(computationAmount)}</Text>
                                    </View>
                                </View>
                            )
                        })}
                    </>
                ) : null}
            </Page>
        </Document>
    )
}
