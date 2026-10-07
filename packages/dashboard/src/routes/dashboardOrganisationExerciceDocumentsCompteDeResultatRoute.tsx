import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const IncomeStatementReportPage = lazy(() =>
    import("../features/dashboard/$idYear/reports/incomeStatementReport/IncomeStatementReportPage.js").then((m) => ({
        default: m.IncomeStatementReportPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function IncomeStatementReportPageWrapper() {
    return (
        <Page.Root>
            <Page.Content>
                <IncomeStatementReportPage />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceDocumentsCompteDeResultatRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/documents/compte-de-résultat",
    component: IncomeStatementReportPageWrapper,
})
