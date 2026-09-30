import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"

const OrganizationTabContent = lazy(() =>
    import("../features/dashboard/$idOrganization/OrganizationTabContent.js").then((m) => ({
        default: m.OrganizationTabContent,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationTabContentWrapper() {
    const { idOrganization } = useParams({
        strict: false,
    }) as {
        idOrganization: string
    }
    return <OrganizationTabContent idOrganization={idOrganization} />
}

export const dashboardOrganisationIndexRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization",
    component: OrganizationTabContentWrapper,
})
