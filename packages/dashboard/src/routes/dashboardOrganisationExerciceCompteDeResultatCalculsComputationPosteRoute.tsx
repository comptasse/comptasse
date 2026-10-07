import { createRoute } from "@tanstack/react-router"
import { lazy } from "react"

const ComputationIncomeStatementLayout = lazy(() =>
    import(
        "../features/dashboard/$idYear/yearSettings/incomeStatements/computations/$idComputation/computationIncomeStatements/$idComputationIncomeStatement/ComputationIncomeStatementLayout.js"
    ).then((m) => ({
        default: m.ComputationIncomeStatementLayout,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function ComputationIncomeStatementLayoutWrapper() {
    return <ComputationIncomeStatementLayout />
}

export const dashboardOrganisationExerciceCompteDeResultatCalculsComputationPosteRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/compte-de-résultat/calculs/$idComputation/postes/$idComputationIncomeStatement",
    component: ComputationIncomeStatementLayoutWrapper,
})
