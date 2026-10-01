import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const MatchingsPage = lazy(() =>
    import("../features/dashboard/$idYear/matchings/MatchingsPage.js").then((m) => ({
        default: m.MatchingsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function MatchingsPageWrapper() {
    return <MatchingsPage />
}

export const dashboardOrganisationExerciceLettragesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/lettrages",
    component: MatchingsPageWrapper,
})
