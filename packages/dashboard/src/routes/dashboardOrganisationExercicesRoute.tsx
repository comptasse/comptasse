import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const YearsPage = lazy(() =>
    import("../features/dashboard/$idOrganization/years/YearsPage.js").then((m) => ({
        default: m.YearsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function YearsPageWrapper() {
    return <YearsPage />
}

export const dashboardOrganisationExercicesRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercices",
    component: YearsPageWrapper,
})
