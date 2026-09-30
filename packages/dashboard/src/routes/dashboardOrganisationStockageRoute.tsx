import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const OrganizationStoragePage = lazy(() =>
    import("../features/dashboard/$idOrganization/organizationStorage/OrganizationStoragePage.js").then((m) => ({
        default: m.OrganizationStoragePage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationStoragePageWrapper() {
    return <OrganizationStoragePage />
}

export const dashboardOrganisationStockageRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/stockage",
    component: OrganizationStoragePageWrapper,
})
