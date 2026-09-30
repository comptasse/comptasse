import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const InventoryPage = lazy(() =>
    import("../features/dashboard/$idYear/inventory/inventoryPage.js").then((m) => ({
        default: m.InventoryPage,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function InventoryPageWrapper() {
    return <InventoryPage />
}

export const dashboardOrganisationExerciceInventaireRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/inventaire",
    component: InventoryPageWrapper,
})
