import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"
import { Page } from "../components/layouts/page/page.js"

const JournalsPage = lazy(() =>
    import("../features/dashboard/$idYear/yearSettings/journals/JournalsPage.js").then((m) => ({
        default: m.JournalsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function JournalsPageWrapper() {
    const { idOrganization, idYear } = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
    }
    return (
        <Page.Root>
            <Page.Content>
                <JournalsPage
                    idOrganization={idOrganization}
                    idYear={idYear}
                />
            </Page.Content>
        </Page.Root>
    )
}

export const dashboardOrganisationExerciceJournauxRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/journaux",
    component: JournalsPageWrapper,
})
