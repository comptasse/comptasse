import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const ComputationLayout = lazy(() =>
    import(
        "../features/dashboard/$idYear/yearSettings/incomeStatements/computations/$idComputation/ComputationLayout.js"
    ).then((m) => ({
        default: m.ComputationLayout,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function ComputationLayoutWrapper() {
    return <ComputationLayout />
}

export const dashboardOrganisationExerciceCompteDeResultatCalculsComputationRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs/$idComputation",
    component: ComputationLayoutWrapper,
})
