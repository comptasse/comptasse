import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const TagsPage = lazy(() =>
    import("../features/dashboard/$idYear/yearSettings/tags/TagsPage.js").then((m) => ({
        default: m.TagsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function TagsPageWrapper() {
    const { idOrganization, idYear } = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <TagsPage
                    idOrganization={idOrganization}
                    idYear={idYear}
                />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceCategoriesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/catégories",
    component: TagsPageWrapper,
})
