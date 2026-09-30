import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const FilesPage = lazy(() =>
    import("../features/dashboard/$idOrganization/organizationStorage/FilesPage.js").then((m) => ({
        default: m.FilesPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function FilesPageWrapper() {
    return <FilesPage />
}

export const dashboardOrganisationExerciceStockageRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/stockage",
    component: FilesPageWrapper,
})
