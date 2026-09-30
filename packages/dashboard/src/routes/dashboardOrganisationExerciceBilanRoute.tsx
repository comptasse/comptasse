import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const BalanceSheetsPage = lazy(() =>
    import("../features/dashboard/$idYear/yearSettings/balanceSheets/BalanceSheetsPage.js").then((m) => ({
        default: m.BalanceSheetsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function BalanceSheetsPageWrapper() {
    const { idOrganization, idYear } = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <BalanceSheetsPage
                    idOrganization={idOrganization}
                    idYear={idYear}
                />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceBilanRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/bilan",
    component: BalanceSheetsPageWrapper,
})
