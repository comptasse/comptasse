import { css } from "@comptasse/ui/utilities/cn.js"
import { IconInfoCircle } from "@tabler/icons-react"
import { DocLink } from "../../../../../../components/document/DocLink.js"
import type { AccountEntry } from "../accountsData.js"

export function SummaryAccountBanner(props: { entry: AccountEntry }) {
    const { entry } = props

    return (
        <div
            className={css({
                display: "flex",
                gap: "0.75rem",
                padding: "1rem 1.25rem",
                borderRadius: "lg",
                backgroundColor: "information/5",
                border: "1px solid",
                borderColor: "information/15",
            })}
        >
            <IconInfoCircle
                size={18}
                className={css({
                    stroke: "information",
                    flexShrink: 0,
                    marginTop: "0.125rem",
                })}
            />
            <div
                className={css({
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                })}
            >
                <span
                    className={css({
                        fontSize: "sm",
                        fontWeight: "semibold",
                        color: "information",
                    })}
                >
                    Compte de regroupement
                </span>
                <span
                    className={css({
                        fontSize: "sm",
                        color: "neutral/70",
                        lineHeight: "1.6",
                    })}
                >
                    Ce compte à {entry.number.length} chiffre{entry.number.length > 1 ? "s" : ""} est un compte de
                    classification. Il ne peut pas être utilisé directement dans une{" "}
                    <DocLink to="/documentation/comptabilité/introduction/écritures">écriture comptable</DocLink>. Les
                    écritures doivent être passées dans les sous-comptes à 3 chiffres ou plus.
                </span>
            </div>
        </div>
    )
}
