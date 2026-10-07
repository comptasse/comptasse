import { createRoute } from "@tanstack/react-router"
import { DocRoot } from "../../../../components/document/DocRoot"
import { ReferenceApiGuideDocPage } from "../../../../features/docs/guide/ReferenceApiGuideDocPage.js"
import { guideDocLayoutRoute } from "./guideDocLayoutRoute.js"

export const referenceApiGuideDocRoute = createRoute({
    getParentRoute: () => guideDocLayoutRoute,
    path: "/référence-api",
    beforeLoad: () => ({
        title: "Référence API",
        description: "Conventions, codes d'erreur et catalogue des endpoints de l'API Comptasse.",
    }),
    component: () => (
        <DocRoot>
            <ReferenceApiGuideDocPage />
        </DocRoot>
    ),
})
