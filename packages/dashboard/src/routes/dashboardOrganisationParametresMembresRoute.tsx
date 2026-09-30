import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const OrganizationUsersPage = lazy(() =>
    import("../features/dashboard/$idOrganization/organizationUsers/OrganizationUsersPage.js").then((m) => ({
        default: m.OrganizationUsersPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationUsersPageWrapper() {
    const { idOrganization } = useParams({
        strict: false,
    }) as {
        idOrganization: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <OrganizationUsersPage idOrganization={idOrganization} />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationParametresMembresRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/paramètres/membres",
    component: OrganizationUsersPageWrapper,
})
