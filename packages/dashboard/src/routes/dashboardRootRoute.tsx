import { createRoute, redirect } from "@tanstack/react-router"
import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

export const dashboardRootRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/",
    beforeLoad: () => {
        throw redirect({
            to: "/organisations",
        })
    },
    component: () => null,
})
