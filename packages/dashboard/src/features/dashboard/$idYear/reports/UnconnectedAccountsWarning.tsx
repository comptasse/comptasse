import type { returnedSchemas } from "@comptasse/application-metadata/schemas"
import { css } from "@comptasse/ui/utilities/cn.js"
import type * as v from "valibot"
import { getAccountTotals } from "./getAccountTotals.ts"

/**
 * Warns about accounts that carry a balance but are not attached to any report
 * line, so they are silently excluded from the report and its totals may not
 * balance. Used by both the balance sheet and the income statement reports.
 */
export function UnconnectedAccountsWarning(props: {
    kind: "balance-sheet" | "income-statement"
    accounts: Array<v.InferOutput<typeof returnedSchemas.account>>
    entryLines: Array<v.InferOutput<typeof returnedSchemas.entryLine>>
}) {
    const accountTotals = getAccountTotals(props.entryLines)

    const unconnectedAccounts = props.accounts
        .filter((account) => account.type === props.kind)
        .filter((account) => {
            if (props.kind === "balance-sheet") {
                return account.idBalanceSheetAsset === null && account.idBalanceSheetLiability === null
            }
            return account.idIncomeStatement === null
        })
        .map((account) => {
            const totals = accountTotals.get(account.id)
            const net = (totals?.totalDebit ?? 0) - (totals?.totalCredit ?? 0)
            return {
                account,
                net,
            }
        })
        .filter((item) => Math.abs(item.net) > 0.001)
        .sort((a, b) => String(a.account.number).localeCompare(String(b.account.number)))

    if (unconnectedAccounts.length === 0) return null

    const settingsLabel = props.kind === "balance-sheet" ? "plan de bilan" : "compte de résultat"

    return (
        <div
            className={css({
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                padding: "0.75rem 1rem",
                borderRadius: "lg",
                border: "1px solid",
                borderColor: "error/25",
                backgroundColor: "error/10",
            })}
        >
            <span
                className={css({
                    fontSize: "sm",
                    fontWeight: "semibold",
                    color: "error",
                })}
            >
                {unconnectedAccounts.length} compte(s) non rattaché(s) au {settingsLabel}
            </span>
            <span
                className={css({
                    fontSize: "xs",
                    color: "neutral/75",
                })}
            >
                Ces comptes ont un solde mais ne sont rattachés à aucune ligne : ils sont absents du rapport et les
                totaux peuvent ne pas équilibrer. Rattachez-les depuis le plan comptable.
            </span>
            <span
                className={css({
                    fontSize: "xs",
                    color: "neutral/75",
                })}
            >
                {unconnectedAccounts.map((item) => `${item.account.number} (${item.net.toFixed(2)} €)`).join(", ")}
            </span>
        </div>
    )
}
