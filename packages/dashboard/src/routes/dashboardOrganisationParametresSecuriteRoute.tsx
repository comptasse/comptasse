import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const OrganizationSecurityPage = lazy(() =>
    import("../features/dashboard/$idOrganization/organizationSettings/OrganizationSecurityPage.js").then((m) => ({
        default: m.OrganizationSecurityPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationSecurityPageWrapper() {
    const { idOrganization } = useParams({
        strict: false,
    }) as {
        idOrganization: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <OrganizationSecurityPage idOrganization={idOrganization} />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationParametresSecuriteRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/paramètres/sécurité",
    component: OrganizationSecurityPageWrapper,
})
