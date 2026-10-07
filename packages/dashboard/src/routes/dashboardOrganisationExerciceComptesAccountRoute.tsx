import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const AccountLayout = lazy(() =>
    import("../features/dashboard/$idYear/yearSettings/accounts/$idAccount/AccountLayout.js").then((m) => ({
        default: m.AccountLayout,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function AccountLayoutWrapper() {
    return <AccountLayout />
}

export const dashboardOrganisationExerciceComptesAccountRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/comptes/$idAccount",
    component: AccountLayoutWrapper,
})
