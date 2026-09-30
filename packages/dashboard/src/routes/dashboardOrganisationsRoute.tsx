import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const OrganizationsPage = lazy(() =>
    import("../features/dashboard/organizations/OrganizationsPage.js").then((m) => ({
        default: m.OrganizationsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationsPageWrapper() {
    return <OrganizationsPage />
}

export const dashboardOrganisationsRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisations",
    component: OrganizationsPageWrapper,
})
