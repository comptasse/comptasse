import { createRoute, useParams } from "@tanstack/react-router"
import { lazy } from "react"

const FileTabContent = lazy(() =>
    import("../features/dashboard/$idOrganization/organizationStorage/$idFile/FileTabContent.js").then((m) => ({
        default: m.FileTabContent,
    })),
)

import { dashboardLayoutRoute } from "./dashboardLayoutRoute.js"

function FileTabContentWrapper() {
    const { idOrganization, idFile } = useParams({
        strict: false,
    }) as {
        idOrganization: string
        idFile: string
    }
    return (
        <FileTabContent
            idOrganization={idOrganization}
            idFile={idFile}
        />
    )
}

export const dashboardOrganisationFichierIdRoute = createRoute({
    getParentRoute: () => dashboardLayoutRoute,
    path: "/organisation/$idOrganization/fichier/$idFile",
    component: FileTabContentWrapper,
})
