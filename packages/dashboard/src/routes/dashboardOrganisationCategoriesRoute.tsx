import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const OrganizationTagsPage = lazy(() =>
    import("../features/dashboard/$idOrganization/tags/OrganizationTagsPage.js").then((m) => ({
        default: m.OrganizationTagsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationTagsPageWrapper() {
    return <OrganizationTagsPage />
}

export const dashboardOrganisationCategoriesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/catégories",
    component: OrganizationTagsPageWrapper,
})
