import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const UserProfilePage = lazy(() =>
    import("../features/dashboard/profile/UserProfilePage.js").then((m) => ({
        default: m.UserProfilePage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

export const dashboardParametresRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/paramètres",
    component: () => <UserProfilePage />,
})
