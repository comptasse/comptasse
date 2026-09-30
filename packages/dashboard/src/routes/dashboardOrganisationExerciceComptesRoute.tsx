import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const AccountsPage = lazy(() =>
    import("../features/dashboard/$idYear/yearSettings/accounts/AccountsPage.js").then((m) => ({
        default: m.AccountsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function AccountsPageWrapper() {
    const { idOrganization, idYear } = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <AccountsPage
                    idOrganization={idOrganization}
                    idYear={idYear}
                />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceComptesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/comptes",
    component: AccountsPageWrapper,
})
