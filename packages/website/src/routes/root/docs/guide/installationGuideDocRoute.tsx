import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { InstallationGuideDocPage } from "../../../../features/docs/guide/InstallationGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const installationGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/installation",
    beforeLoad: () => ({
        title: "Installation",
        description:
            "Mettez en place Comptasse : installation du CLI, conventions de l'API et premiers pas sur le dashboard.",
    }),
    component: () => (
        <DocRoot>
            <InstallationGuideDocPage />
        </DocRoot>
    ),
})
