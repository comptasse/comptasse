import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"

const EntryTabContent = lazy(() =>
    import("../features/dashboard/$idYear/entries/$idEntry/EntryTabContent.js").then((m) => ({
        default: m.EntryTabContent,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function EntryTabContentWrapper() {
    const { idOrganization, idYear, idEntry } = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idYear: string
        idEntry: string
    }
    return (
        <EntryTabContent
            idOrganization={idOrganization}
            idYear={idYear}
            idEntry={idEntry}
        />
    )
}

export const dashboardOrganisationExerciceEcritureIdRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/exercice/$idYear/ecriture/$idEntry",
    component: EntryTabContentWrapper,
})
