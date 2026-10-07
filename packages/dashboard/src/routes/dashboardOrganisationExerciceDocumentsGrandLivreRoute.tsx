import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const LedgerReportPage = lazy(() =>
    import("../features/dashboard/$idYear/reports/ledgerReport/LedgerReportPage.js").then((m) => ({
        default: m.LedgerReportPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function LedgerReportPageWrapper() {
    return (
        <Page.Root>
            <Page.Content>
                <LedgerReportPage />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceDocumentsGrandLivreRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/documents/grand-livre",
    component: LedgerReportPageWrapper,
})
