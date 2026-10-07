import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const JournalReportPage = lazy(() =>
    import("../features/dashboard/$idYear/reports/journalReport/JournalReportPage.js").then((m) => ({
        default: m.JournalReportPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function JournalReportPageWrapper() {
    return (
        <Page.Root>
            <Page.Content>
                <JournalReportPage />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceDocumentsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/documents",
    component: JournalReportPageWrapper,
})
