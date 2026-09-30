import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const SettingsPage = lazy(() =>
    import("../features/dashboard/settings/SettingsPage.js").then((m) => ({
        default: m.SettingsPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function SettingsPageWrapper() {
    return <SettingsPage />
}

export const dashboardParametresApplicationRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/paramètres/application",
    component: SettingsPageWrapper,
})
