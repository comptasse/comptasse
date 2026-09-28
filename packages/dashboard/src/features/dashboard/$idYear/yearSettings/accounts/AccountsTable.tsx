import { readAllAccountsRouteDefinition } from "@comptasse/application-metadata/routes"
import { CircularLoader, FormatError } from "@comptasse/ui"
import { css } from "@comptasse/ui/utilities/cn.js"
import { IconListNumbers } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { EmptyState } from "../../../../../components/layouts/EmptyState.tsx"
import { Virtualizer } from "../../../../../components/layouts/Virtualizer.tsx"
import { useDataFromAPI } from "../../../../../utilities/useHTTPData.ts"
import { ACCOUNT_ITEM_HEIGHT, AccountItem } from "./accountItem.tsx"
import { sortAccounts } from "./sortAccounts.tsx"

export function AccountsTable(props: { idOrganization: string; idYear: string; globalFilter: string }) {
    const navigate = useNavigate()

    const response = useDataFromAPI({
        routeDefinition: readAllAccountsRouteDefinition,
        body: {
            idYear: props.idYear,
        },
    })

    const structuredAccounts = useMemo(() => {
        if (!response.data) return []

        const normalizedFilter = props.globalFilter.trim().toLowerCase()
        const filtered =
            normalizedFilter === ""
                ? response.data
                : response.data.filter((account) => {
                      const text = `${account.number} ${account.label}`.toLowerCase()
                      return text.includes(normalizedFilter)
                  })

        const sorted = [
            ...filtered,
        ].sort((a, b) => a.number.toString().localeCompare(b.number.toString()))

        return sortAccounts({
            accounts: sorted,
        })
    }, [
        response.data,
        props.globalFilter,
    ])

    const hrefBase = `/organisation/${props.idOrganization}/exercice/${props.idYear}/comptes`

    const renderAccount = useCallback(
        (sortedAccount: (typeof structuredAccounts)[number]) => (
            <AccountItem
                account={sortedAccount.account}
                level={sortedAccount.level}
                href={hrefBase}
                onClick={() =>
                    navigate({
                        to: "/organisation/$idOrganization/exercice/$idYear/comptes",
                        params: {
                            idOrganization: props.idOrganization,
                            idYear: props.idYear,
                        },
                    })
                }
            />
        ),
        [
            hrefBase,
            navigate,
            props.idOrganization,
            props.idYear,
        ],
    )

    return (
        <div
            className={css({
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                padding: "1rem",
            })}
        >
            {response.data === undefined ? (
                response.isPending ? (
                    <div
                        className={css({
                            padding: "1rem",
                        })}
                    >
                        <CircularLoader text="Chargement des données..." />
                    </div>
                ) : (
                    <FormatError
                        text="Erreur lors de la récupération des données."
                        className={{
                            padding: "1rem",
                        }}
                    />
                )
            ) : structuredAccounts.length === 0 ? (
                <EmptyState
                    icon={<IconListNumbers />}
                    title={props.globalFilter ? "Aucun compte trouvé" : "Aucun compte"}
                    subtitle={props.globalFilter ? undefined : "Ajoutez un compte pour commencer"}
                />
            ) : (
                <div
                    className={css({
                        width: "100%",
                        height: "100%",
                    })}
                >
                    <Virtualizer
                        data={structuredAccounts}
                        childSize={ACCOUNT_ITEM_HEIGHT}
                    >
                        {renderAccount}
                    </Virtualizer>
                </div>
            )}
        </div>
    )
}
