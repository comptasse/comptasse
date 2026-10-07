import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const BalanceSheetReportPage = lazy(() =>
    import("../features/dashboard/$idYear/reports/balanceSheetReport/BalanceSheetReportPage.js").then((m) => ({
        default: m.BalanceSheetReportPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function BalanceSheetReportPageWrapper() {
    return (
        <Page.Root>
            <Page.Content>
                <BalanceSheetReportPage />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceDocumentsBilanRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/documents/bilan",
    component: BalanceSheetReportPageWrapper,
})
