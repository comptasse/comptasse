import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const BalanceReportPage = lazy(() =>
    import("../features/dashboard/$idYear/reports/balanceReport/BalanceReportPage.js").then((m) => ({
        default: m.BalanceReportPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function BalanceReportPageWrapper() {
    return (
        <Page.Root>
            <Page.Content>
                <BalanceReportPage />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceDocumentsBalanceRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/documents/balance",
    component: BalanceReportPageWrapper,
})
