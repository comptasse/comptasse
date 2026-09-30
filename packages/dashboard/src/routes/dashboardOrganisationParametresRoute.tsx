import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const OrganizationSettingsPage = lazy(() =>
    import("../features/dashboard/$idOrganization/organizationSettings/OrganizationSettingsPage.js").then((m) => ({
        default: m.OrganizationSettingsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function OrganizationSettingsPageWrapper() {
    const { idOrganization } = useParams({
        strict: false,
    }) as {
        idOrganization: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <OrganizationSettingsPage idOrganization={idOrganization} />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationParametresRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/paramètres",
    component: OrganizationSettingsPageWrapper,
})
